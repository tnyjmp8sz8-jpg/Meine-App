import Foundation
import UIKit
import UniformTypeIdentifiers
import WebKit

/// Sicherung von selbst (seit 0.5). Die Web-App schickt den Text ihrer Sicherung, sobald sich etwas geändert hat
/// (derselbe Text wie bei „Sicherung speichern“). Hier wird er als Datei abgelegt: eine je Tag, die 14 neuesten bleiben.
/// Ort: der Ordner „Dokumente“ der App. In „Dateien“ steht er unter „Auf meinem iPhone › Track.“ (siehe Info/App.plist).
/// Wahlweise zusätzlich in einem Ordner, den der Nutzer wählt, z. B. in iCloud Drive: Der bleibt auch, wenn die App gelöscht wird.
final class Sicherung {
    static let shared = Sicherung()

    /// Schlüssel in UserDefaults: Zeit der letzten gelungenen Sicherung (ms), Lesezeichen des zusätzlichen Ordners, dessen Name
    private enum Merker { static let zeit = "sicherungZeit", ordner = "sicherungOrdner", name = "sicherungOrdnerName" }

    /// Setzt die Hülle (siehe WebView): meldet der Web-App das Ergebnis. true: vorher auch die Auskunft neu schicken.
    var melden: ((Bool) -> Void)?

    /// Geschrieben wird der Reihe nach und nie auf dem Hauptthread
    private let reihe = DispatchQueue(label: "de.trackapp.track.sicherung")
    /// Was beim letzten Versuch nicht ging (leer = nichts). Nur auf dem Hauptthread gelesen und geschrieben.
    private var fehler = ""

    /// Ordner „Dokumente“ der App. Dort liegen nur die Sicherungen (die nachgeladene Web-App liegt in Application Support).
    static var ordner: URL { FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] }

    /// Nur Namen wie track-sicherung-2026-11-18.json, vom ersten bis zum letzten Zeichen
    static func passt(_ name: String) -> Bool {
        let treffer = name.range(of: #"^track-sicherung-[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$"#, options: .regularExpression)
        return treffer == (name.startIndex..<name.endIndex)
    }

    /// Namen der Sicherungen in einem Ordner, die älteste zuerst (das Datum steht im Namen)
    static func dateien(in wo: URL) -> [String] {
        let alle = (try? FileManager.default.contentsOfDirectory(atPath: wo.path)) ?? []
        return alle.filter { passt($0) }.sorted()
    }

    /// Ob sich die neueste Sicherung in „Dokumente“ lesen lässt und von Track. stammt (für den Selbsttest)
    static func neuesteLesbar() -> Bool {
        guard let name = dateien(in: ordner).last, let daten = try? Data(contentsOf: ordner.appendingPathComponent(name)),
              let inhalt = (try? JSONSerialization.jsonObject(with: daten)) as? [String: Any] else { return false }
        return inhalt["app"] as? String == "takt"
    }

    /// Für die Web-App: t = Zeit der letzten gelungenen Sicherung in ms (0 = noch keine), ordner = Name des zusätzlichen Ordners (leer = keiner),
    /// fehler = was beim letzten Versuch nicht ging (leer = nichts)
    var auskunft: [String: Any] {
        let vorrat = UserDefaults.standard
        var name = ""
        if vorrat.data(forKey: Merker.ordner) != nil {
            name = vorrat.string(forKey: Merker.name) ?? ""
            if name.isEmpty { name = "Ordner" }
        }
        return ["t": vorrat.double(forKey: Merker.zeit), "ordner": name, "fehler": fehler]
    }

    /// Nachricht der Web-App { art: 'sicherung', name, text }: prüfen, schreiben, Ergebnis melden
    func annehmen(_ inhalt: [String: Any]) {
        let name = inhalt["name"] as? String ?? ""
        let text = inhalt["text"] as? String ?? ""
        reihe.async {
            let (geschrieben, was) = Sicherung.ablegen(name: name, text: text)
            DispatchQueue.main.async {
                if geschrieben { UserDefaults.standard.set((Date().timeIntervalSince1970 * 1000).rounded(), forKey: Merker.zeit) }
                self.fehler = was
                self.melden?(false)
            }
        }
    }

    /// Prüft und schreibt (in der Warteschlange). Liefert, ob die Datei in „Dokumente“ liegt, und was nicht ging.
    /// Klappt nur der zusätzliche Ordner nicht, gilt die Sicherung trotzdem als geschrieben; der Fehler nennt dann den Ordner.
    private static func ablegen(name: String, text: String) -> (Bool, String) {
        let daten = Data(text.utf8)
        guard passt(name), daten.count < 20 * 1024 * 1024,
              let inhalt = (try? JSONSerialization.jsonObject(with: daten)) as? [String: Any], inhalt["app"] as? String == "takt" else {
            return (false, "Die Sicherung war nicht lesbar und wurde nicht gespeichert.")
        }
        do {
            try FileManager.default.createDirectory(at: ordner, withIntermediateDirectories: true)
            // Atomar: Die Datei des Tages wird erst ersetzt, wenn die neue ganz geschrieben ist
            try daten.write(to: ordner.appendingPathComponent(name), options: .atomic)
        } catch {
            return (false, "Die Sicherung ließ sich nicht speichern.")
        }
        aufraeumen(ordner, abgestimmt: false)
        return (true, zusaetzlich(name: name, daten: daten))
    }

    /// Es bleiben die 14 neuesten. Andere Dateien im Ordner werden nie angefasst.
    private static func aufraeumen(_ wo: URL, abgestimmt: Bool) {
        for name in dateien(in: wo).dropLast(14) {
            let ort = wo.appendingPathComponent(name)
            if abgestimmt {
                NSFileCoordinator(filePresenter: nil).coordinate(writingItemAt: ort, options: .forDeleting, error: nil) { ziel in
                    _ = try? FileManager.default.removeItem(at: ziel)
                }
            } else {
                _ = try? FileManager.default.removeItem(at: ort)
            }
        }
    }

    /// Legt die Datei zusätzlich in den gewählten Ordner (über sein Lesezeichen). Liefert leer oder, was nicht ging, mit dem Namen des Ordners.
    private static func zusaetzlich(name: String, daten: Data) -> String {
        let vorrat = UserDefaults.standard
        guard let lesezeichen = vorrat.data(forKey: Merker.ordner) else { return "" }
        let titel = vorrat.string(forKey: Merker.name) ?? "Ordner"
        let ging = "In „" + titel + "“ ließ sich nicht sichern. Auf dem iPhone ist die Sicherung gespeichert."
        var veraltet = false
        guard let ziel = try? URL(resolvingBookmarkData: lesezeichen, options: [], relativeTo: nil, bookmarkDataIsStale: &veraltet) else { return ging }
        // Zugriff auf einen Ordner außerhalb der App: öffnen und am Ende immer wieder schließen
        let offen = ziel.startAccessingSecurityScopedResource()
        defer { if offen { ziel.stopAccessingSecurityScopedResource() } }
        // Ein veraltetes Lesezeichen gilt noch dieses Mal: gleich ein neues anlegen
        if veraltet, let neu = try? ziel.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil) {
            vorrat.set(neu, forKey: Merker.ordner)
        }
        var gesperrt: NSError?
        var geschrieben = false
        NSFileCoordinator(filePresenter: nil).coordinate(writingItemAt: ziel.appendingPathComponent(name), options: .forReplacing, error: &gesperrt) { ort in
            geschrieben = (try? daten.write(to: ort)) != nil
        }
        guard geschrieben, gesperrt == nil else { return ging }
        aufraeumen(ziel, abgestimmt: true)
        return ""
    }

    /// Die neueste eigene Sicherung in den gerade gewählten Ordner legen. Gibt es noch keine, ist nichts zu tun.
    private static func nachtragen() -> String {
        guard let name = dateien(in: ordner).last, let daten = try? Data(contentsOf: ordner.appendingPathComponent(name)) else { return "" }
        return zusaetzlich(name: name, daten: daten)
    }

    /// Der Nutzer hat einen zusätzlichen Ordner gewählt (Hauptthread): Lesezeichen merken, die neueste Sicherung gleich dorthin legen
    /// (so sieht er sofort, dass es klappt), dann der Web-App Auskunft und Ergebnis melden.
    func ordnerMerken(_ ziel: URL) {
        // Erst den Zugriff öffnen, dann das Lesezeichen anlegen: Sonst gilt es nach dem nächsten Start der App nicht mehr
        let offen = ziel.startAccessingSecurityScopedResource()
        let lesezeichen = try? ziel.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil)
        let titel = (try? ziel.resourceValues(forKeys: [.localizedNameKey]))?.localizedName ?? ziel.lastPathComponent
        if offen { ziel.stopAccessingSecurityScopedResource() }
        guard let marke = lesezeichen else {
            fehler = "Der Ordner ließ sich nicht merken."
            melden?(true)
            return
        }
        UserDefaults.standard.set(marke, forKey: Merker.ordner)
        UserDefaults.standard.set(titel, forKey: Merker.name)
        reihe.async {
            let was = Sicherung.nachtragen()
            DispatchQueue.main.async {
                self.fehler = was
                self.melden?(true)
            }
        }
    }
}

/// Auswahl des zusätzlichen Ordners (Nachricht { art: 'ordner' } der Web-App). Abbrechen ändert nichts.
extension Halter: UIDocumentPickerDelegate {
    func ordnerWaehlen() {
        // Vom obersten gezeigten Fenster-Inhalt aus; läuft die Auswahl schon, kommt keine zweite
        var oben = view?.window?.rootViewController
        while let weiter = oben?.presentedViewController { oben = weiter }
        guard let zeiger = oben, !(zeiger is UIDocumentPickerViewController) else { return }
        let wahl = UIDocumentPickerViewController(forOpeningContentTypes: [.folder])
        wahl.delegate = self
        zeiger.present(wahl, animated: true)
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        if let ziel = urls.first { Sicherung.shared.ordnerMerken(ziel) }
    }
}

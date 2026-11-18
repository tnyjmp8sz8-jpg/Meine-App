import Foundation
import UIKit
import UniformTypeIdentifiers
import WebKit

/// Sicherung von selbst (seit 0.5). Die Web-App schickt den Text ihrer Sicherung, sobald sich etwas geändert hat
/// (derselbe Text wie bei „Sicherung speichern“). Hier wird er als Datei abgelegt: eine je Tag, die 14 neuesten bleiben.
/// Ort: der Ordner „Dokumente“ der App. In „Dateien“ steht er unter „Auf meinem iPhone › Track.“ (siehe Info/App.plist).
/// Wahlweise zusätzlich in einem Ordner, den der Nutzer wählt, z. B. in iCloud Drive: Der bleibt auch, wenn die App gelöscht wird.
/// Die Dateien heißen track-automatisch-JJJJ-MM-TT.json, also anders als die von Hand gespeicherten (track-sicherung-…): Aufgeräumt
/// werden nur sie. Liegen im gewählten Ordner schon Sicherungen von Hand, bleiben die liegen.
final class Sicherung {
    static let shared = Sicherung()

    /// Schlüssel in UserDefaults: Zeit der letzten gelungenen Sicherung in „Dokumente“ (ms), Zeit des Stands, der zuletzt auch im gewählten Ordner
    /// ankam (ms), Lesezeichen des gewählten Ordners, dessen Name
    private enum Merker { static let zeit = "sicherungZeit", aussen = "sicherungAussen", ordner = "sicherungOrdner", name = "sicherungOrdnerName" }

    /// Setzt die Hülle (siehe WebView): meldet der Web-App, wie es um die Sicherung steht
    var melden: (() -> Void)?

    /// Geschrieben wird der Reihe nach und nie auf dem Hauptthread. Der gewählte Ordner hat seine eigene Reihe: Er kann in iCloud liegen
    /// und lange brauchen oder hängen. Die Datei in „Dokumente“ und ihre Meldung warten darauf nie.
    private let reihe = DispatchQueue(label: "de.trackapp.track.sicherung")
    private let reiheAussen = DispatchQueue(label: "de.trackapp.track.sicherung.ordner")

    // Alles Folgende wird nur auf dem Hauptthread gelesen und geschrieben.
    /// Was beim letzten Schreiben in „Dokumente“ nicht ging, und was beim letzten Kopieren in den gewählten Ordner (leer = nichts)
    private var fehlerInnen = "", fehlerAussen = ""
    /// Wie viele Sicherungen gerade in „Dokumente“ geschrieben werden · ob eine Kopie in den gewählten Ordner läuft ·
    /// ob währenddessen eine neuere Sicherung kam (dann wird danach noch einmal kopiert, immer die dann neueste Datei)
    private var laeuft = 0, kopiert = false, nochmal = false

    /// Ob gerade etwas geschrieben wird: So lange hält die Hülle die App beim Verlassen wach
    var schreibt: Bool { laeuft > 0 || kopiert }

    /// Ordner „Dokumente“ der App. Dort liegen nur die Sicherungen (die nachgeladene Web-App liegt in Application Support).
    static var ordner: URL { FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] }

    /// Ob der Name vom ersten bis zum letzten Zeichen auf das Muster passt
    private static func passt(_ name: String, _ muster: String) -> Bool {
        let treffer = name.range(of: muster, options: .regularExpression)
        return treffer == (name.startIndex..<name.endIndex)
    }

    /// Die Web-App schickt ihre Sicherung unter dem Namen track-sicherung-2026-11-18.json. Liefert den Namen der Datei dafür,
    /// track-automatisch-2026-11-18.json, oder nil, wenn der geschickte Name nicht genau so aussieht.
    static func dateiname(_ name: String) -> String? {
        guard passt(name, #"^track-sicherung-[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$"#) else { return nil }
        return "track-automatisch-" + String(name.dropFirst("track-sicherung-".count))
    }

    /// Nur Dateien, die die App selbst abgelegt hat: track-automatisch-2026-11-18.json
    static func eigene(_ name: String) -> Bool { passt(name, #"^track-automatisch-[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$"#) }

    /// Namen der eigenen Sicherungen in einem Ordner, die älteste zuerst (das Datum steht im Namen)
    static func dateien(in wo: URL) -> [String] {
        let alle = (try? FileManager.default.contentsOfDirectory(atPath: wo.path)) ?? []
        return alle.filter { eigene($0) }.sorted()
    }

    /// Ob sich die neueste Sicherung in „Dokumente“ lesen lässt und von Track. stammt (für den Selbsttest)
    static func neuesteLesbar() -> Bool {
        guard let name = dateien(in: ordner).last, let daten = try? Data(contentsOf: ordner.appendingPathComponent(name)),
              let inhalt = (try? JSONSerialization.jsonObject(with: daten)) as? [String: Any] else { return false }
        return inhalt["app"] as? String == "takt"
    }

    /// Für die Web-App: t = Zeit der letzten gelungenen Sicherung in „Dokumente“ in ms (0 = noch keine) · aussen = Zeit des Stands, der zuletzt auch
    /// im gewählten Ordner ankam (0 = noch keiner; nur das liegt außerhalb der App) · ordner = Name des gewählten Ordners (leer = keiner) ·
    /// fehler = was beim letzten Versuch nicht ging (leer = nichts) · nochmal = die Datei in „Dokumente“ wurde zuletzt nicht geschrieben
    /// (die Web-App schickt ihre Sicherung dann beim nächsten Anlass noch einmal; geht nur der Ordner nicht, soll sie das nicht)
    var auskunft: [String: Any] {
        let vorrat = UserDefaults.standard
        var name = ""
        if vorrat.data(forKey: Merker.ordner) != nil {
            name = vorrat.string(forKey: Merker.name) ?? ""
            if name.isEmpty { name = "Ordner" }
        }
        return ["t": vorrat.double(forKey: Merker.zeit), "aussen": vorrat.double(forKey: Merker.aussen), "ordner": name,
                "fehler": fehlerInnen.isEmpty ? fehlerAussen : fehlerInnen, "nochmal": !fehlerInnen.isEmpty]
    }

    /// Nachricht der Web-App { art: 'sicherung', name, text } (Hauptthread): prüfen, in „Dokumente“ schreiben und das Ergebnis gleich melden.
    /// Erst danach folgt die Kopie in den gewählten Ordner, mit eigener Meldung.
    func annehmen(_ inhalt: [String: Any]) {
        let name = inhalt["name"] as? String ?? ""
        let text = inhalt["text"] as? String ?? ""
        laeuft += 1
        reihe.async {
            let was = Sicherung.ablegen(name: name, text: text)
            DispatchQueue.main.async {
                if was.isEmpty { UserDefaults.standard.set((Date().timeIntervalSince1970 * 1000).rounded(), forKey: Merker.zeit) }
                self.fehlerInnen = was
                self.laeuft -= 1
                self.melden?()
                if was.isEmpty { self.kopieren() }
            }
        }
    }

    /// Prüft und schreibt in „Dokumente“ (in der Warteschlange). Liefert leer oder, was nicht ging.
    /// Geprüft werden Name, Größe und Anfang und Ende des Textes: Jede Sicherung der Web-App beginnt mit {"app":"takt", …
    /// Der Text wird bewusst nicht ganz gelesen: Apples JSON-Leser lehnt ein halbes Zeichen (zerschnittenes Emoji) ab,
    /// das die Web-App beim Einlesen ohne Mühe liest. Mit einem solchen Text ginge sonst keine Sicherung mehr.
    private static func ablegen(name: String, text: String) -> String {
        let daten = Data(text.utf8)
        guard let datei = dateiname(name), daten.count < 20 * 1024 * 1024, text.hasPrefix("{\"app\":\"takt\","), text.hasSuffix("}") else {
            return "Die Sicherung war nicht lesbar und wurde nicht gespeichert."
        }
        do {
            try FileManager.default.createDirectory(at: ordner, withIntermediateDirectories: true)
            // Atomar: Die Datei des Tages wird erst ersetzt, wenn die neue ganz geschrieben ist
            try daten.write(to: ordner.appendingPathComponent(datei), options: .atomic)
        } catch {
            return "Die Sicherung ließ sich nicht speichern."
        }
        aufraeumen(ordner, abgestimmt: false)
        return ""
    }

    /// Es bleiben die 14 neuesten eigenen Dateien (siehe eigene). Alles andere im Ordner wird nie angefasst, auch keine Sicherung von Hand.
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

    /// Kopie der neuesten Sicherung in den gewählten Ordner (Hauptthread). Ohne gewählten Ordner geschieht nichts.
    /// Läuft schon eine Kopie, folgt danach genau eine weitere: Es stauen sich nie mehrere, auch wenn der Ordner lange braucht.
    private func kopieren() {
        let vorrat = UserDefaults.standard
        guard vorrat.data(forKey: Merker.ordner) != nil else { return }
        if kopiert {
            nochmal = true
            return
        }
        kopiert = true
        // Der Stand, den die Kopie mindestens hat. Gelingt sie, liegt die Sicherung von diesem Zeitpunkt auch außerhalb der App.
        let stand = vorrat.double(forKey: Merker.zeit)
        reiheAussen.async {
            let was = Sicherung.nachtragen()
            DispatchQueue.main.async {
                self.kopiert = false
                // Wurde der Ordner inzwischen abgewählt, zählt das Ergebnis nicht mehr
                if UserDefaults.standard.data(forKey: Merker.ordner) != nil {
                    if was.isEmpty && stand > 0 { UserDefaults.standard.set(stand, forKey: Merker.aussen) }
                    self.fehlerAussen = was
                }
                self.melden?()
                if self.nochmal {
                    self.nochmal = false
                    self.kopieren()
                }
            }
        }
    }

    /// Legt die neueste eigene Sicherung in den gewählten Ordner, über sein Lesezeichen (in der Warteschlange des Ordners).
    /// Liefert leer oder, was nicht ging, mit dem Namen des Ordners. Gibt es noch keine Sicherung oder keinen Ordner, ist nichts zu tun.
    private static func nachtragen() -> String {
        let vorrat = UserDefaults.standard
        guard let name = dateien(in: ordner).last, let daten = try? Data(contentsOf: ordner.appendingPathComponent(name)),
              let lesezeichen = vorrat.data(forKey: Merker.ordner) else { return "" }
        let titel = vorrat.string(forKey: Merker.name) ?? "Ordner"
        let ging = "In „" + titel + "“ ließ sich nicht sichern. Auf dem iPhone ist die Sicherung gespeichert."
        var veraltet = false
        guard let ziel = try? URL(resolvingBookmarkData: lesezeichen, options: [], relativeTo: nil, bookmarkDataIsStale: &veraltet) else { return ging }
        // Zugriff auf einen Ordner außerhalb der App: öffnen und am Ende immer wieder schließen
        let offen = ziel.startAccessingSecurityScopedResource()
        defer { if offen { ziel.stopAccessingSecurityScopedResource() } }
        // Ein veraltetes Lesezeichen gilt noch dieses Mal: gleich ein neues anlegen (außer es wurde inzwischen ein anderer Ordner gewählt)
        if veraltet, vorrat.data(forKey: Merker.ordner) == lesezeichen, let neu = try? ziel.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil) {
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

    /// Beim Start und beim Zurückkommen in die App (Hauptthread): Fehlt im gewählten Ordner der neueste Stand noch, etwa weil der Ordner
    /// beim letzten Mal nicht erreichbar war, wird er jetzt nachgetragen. So erfährt die Web-App auch nach einem Neustart, ob der Ordner geht.
    func nachholen() {
        let vorrat = UserDefaults.standard
        if vorrat.double(forKey: Merker.aussen) < vorrat.double(forKey: Merker.zeit) { kopieren() }
    }

    /// Der Nutzer hat einen zusätzlichen Ordner gewählt (Hauptthread): Lesezeichen merken und gleich melden (dann steht der Name schon in der App),
    /// danach die neueste Sicherung dorthin legen: So sieht er sofort, dass es klappt.
    func ordnerMerken(_ ziel: URL) {
        // Erst den Zugriff öffnen, dann das Lesezeichen anlegen: Sonst gilt es nach dem nächsten Start der App nicht mehr
        let offen = ziel.startAccessingSecurityScopedResource()
        let lesezeichen = try? ziel.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil)
        let titel = (try? ziel.resourceValues(forKeys: [.localizedNameKey]))?.localizedName ?? ziel.lastPathComponent
        if offen { ziel.stopAccessingSecurityScopedResource() }
        guard let marke = lesezeichen else {
            fehlerAussen = "Der Ordner ließ sich nicht merken."
            melden?()
            return
        }
        UserDefaults.standard.set(marke, forKey: Merker.ordner)
        UserDefaults.standard.set(titel, forKey: Merker.name)
        fehlerAussen = ""
        melden?()
        kopieren()
    }

    /// Der Nutzer will den gewählten Ordner nicht mehr benutzen (Hauptthread). Was dort liegt, bleibt liegen.
    func ordnerVergessen() {
        UserDefaults.standard.removeObject(forKey: Merker.ordner)
        UserDefaults.standard.removeObject(forKey: Merker.name)
        fehlerAussen = ""
        nochmal = false
        melden?()
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

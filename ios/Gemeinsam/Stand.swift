import SwiftUI

/// Was die Web-App der Hülle nach jedem Speichern schickt und das Widget zeigt:
/// für heute und die nächsten sieben Tage je ein Eintrag, damit das Widget auch nach Mitternacht stimmt, ohne dass die App geöffnet wurde.
struct Stand: Codable {
    struct Tag: Codable {
        var d: String       // Datum YYYY-MM-DD
        var rn: Int         // Routinen geplant
        var rd: Int         // Routinen erledigt
        var an: Int         // offene Aufgaben, die bis zu diesem Tag fällig sind
        var auf: [String]   // ihre ersten Titel
    }
    struct Notiz: Codable {
        var id: String      // Kennung in der Web-App; „neu-…“, solange die Notiz erst vorgemerkt ist
        var x: String       // erste Zeile
    }
    var tage: [Tag]
    var notizen: [String]   // nur Text, für die Fassung 0.2
    var nz: [Notiz]?        // die neuesten zehn Notizen mit Kennung

    func tag(_ datum: Date) -> Tag? { let k = Ablage.tag(datum); return tage.first { $0.d == k } }

    static var beispiel: Stand {
        let texte = ["Idee für Kapitel 3", "Milch und Brot", "Rückruf Prof. Weber", "Trainingsplan anpassen", "Geschenk für Mama", "Laufschuhe ansehen", "Folien für Dienstag", "Steuer: Belege suchen", "Fahrrad zur Werkstatt", "Buch zurückgeben"]
        return Stand(tage: [Tag(d: Ablage.tag(Date()), rn: 4, rd: 2, an: 3, auf: ["Seminararbeit abgeben", "Zahnarzt anrufen", "Paket abholen"])], notizen: Array(texte.prefix(4)),
                     nz: texte.enumerated().map { Notiz(id: "b\($0.offset)", x: $0.element) })
    }
}

/// Gemeinsamer Ordner von App und Widget (App-Gruppe)
enum Ablage {
    /// AltStore hängt beim Signieren die Team-Kennung an den Namen der Gruppe und schreibt den echten Namen als ALTAppGroups in die Info.plist
    static var gruppe: String { (Bundle.main.object(forInfoDictionaryKey: "ALTAppGroups") as? [String])?.first ?? "group.de.trackapp.track" }
    static var ordner: URL? { FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: gruppe) }
    static var datei: URL? { ordner?.appendingPathComponent("stand.json") }
    private static var eingangDatei: URL? { ordner?.appendingPathComponent("eingang.json") }

    static func lesen() -> Stand? {
        guard let ort = datei, let daten = try? Data(contentsOf: ort) else { return nil }
        return try? JSONDecoder().decode(Stand.self, from: daten)
    }

    /// Speichert den Stand. true nur, wenn er lesbar ist und sich geändert hat (dann wird das Widget neu gezeichnet).
    static func schreiben(_ daten: Data) -> Bool {
        guard let ort = datei, (try? JSONDecoder().decode(Stand.self, from: daten)) != nil, (try? Data(contentsOf: ort)) != daten else { return false }
        return (try? daten.write(to: ort, options: .atomic)) != nil
    }

    static func tag(_ datum: Date) -> String {
        let t = Calendar.current.dateComponents([.year, .month, .day], from: datum)
        return String(format: "%04d-%02d-%02d", t.year ?? 0, t.month ?? 0, t.day ?? 0)
    }

    static func datum(_ tag: String) -> Date? {
        let z = tag.split(separator: "-").compactMap { Int($0) }
        guard z.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: z[0], month: z[1], day: z[2]))
    }

    // Eingang: Was außerhalb der App eingetragen wird (Widget, Kurzbefehle), kann nicht direkt in den Speicher der Web-App.
    // Es wird hier vorgemerkt; die App übergibt es der Web-App, sobald sie das nächste Mal offen ist. Das Widget zeigt die Änderung sofort.

    static func eingang() -> [[String: Any]] {
        guard let ort = eingangDatei, let daten = try? Data(contentsOf: ort) else { return [] }
        return ((try? JSONSerialization.jsonObject(with: daten)) as? [[String: Any]]) ?? []
    }

    private static func eingangSchreiben(_ liste: [[String: Any]]) {
        guard let ort = eingangDatei, JSONSerialization.isValidJSONObject(liste), let daten = try? JSONSerialization.data(withJSONObject: liste) else { return }
        try? daten.write(to: ort, options: .atomic)
    }

    /// Merkt etwas vor (art: notiz, notizWeg, ausgabe, lauf) und liefert die Kennung des Auftrags
    @discardableResult static func vormerken(_ auftrag: [String: Any]) -> String {
        var neu = auftrag
        let id = UUID().uuidString
        neu["id"] = id
        neu["t"] = Date().timeIntervalSince1970 * 1000
        eingangSchreiben(eingang() + [neu])
        return id
    }

    /// Streicht Aufträge, die die Web-App übernommen hat
    static func erledigt(_ ids: [String]) {
        let liste = eingang()
        let rest = liste.filter { !ids.contains($0["id"] as? String ?? "") }
        if rest.count != liste.count { eingangSchreiben(rest) }
    }

    private static func standAendern(_ aendern: (inout Stand) -> Void) {
        guard let ort = datei, var stand = lesen() else { return }
        aendern(&stand)
        if let daten = try? JSONEncoder().encode(stand) { try? daten.write(to: ort, options: .atomic) }
    }

    static func notizDazu(_ text: String) {
        let id = vormerken(["art": "notiz", "x": text])
        let zeile = String((text.split(whereSeparator: \.isNewline).first ?? "").prefix(80))
        standAendern { $0.nz = [Stand.Notiz(id: "neu-" + id, x: zeile)] + ($0.nz ?? []) }
    }

    /// Abhaken im Widget. Eine Notiz, die selbst erst vorgemerkt ist, wird einfach wieder gestrichen.
    static func notizWeg(_ id: String) {
        if id.hasPrefix("neu-") { erledigt([String(id.dropFirst(4))]) } else { vormerken(["art": "notizWeg", "nid": id]) }
        standAendern { $0.nz = ($0.nz ?? []).filter { $0.id != id } }
    }
}

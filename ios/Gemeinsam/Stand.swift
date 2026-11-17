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
    var tage: [Tag]
    var notizen: [String]

    func tag(_ datum: Date) -> Tag? { let k = Ablage.tag(datum); return tage.first { $0.d == k } }

    static var beispiel: Stand {
        Stand(tage: [Tag(d: Ablage.tag(Date()), rn: 4, rd: 2, an: 3, auf: ["Seminararbeit abgeben", "Zahnarzt anrufen", "Paket abholen"])], notizen: ["Idee für Kapitel 3", "Milch und Brot"])
    }
}

/// Gemeinsamer Ordner von App und Widget (App-Gruppe)
enum Ablage {
    /// AltStore hängt beim Signieren die Team-Kennung an den Namen der Gruppe und schreibt den echten Namen als ALTAppGroups in die Info.plist
    static var gruppe: String { (Bundle.main.object(forInfoDictionaryKey: "ALTAppGroups") as? [String])?.first ?? "group.de.trackapp.track" }
    static var datei: URL? { FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: gruppe)?.appendingPathComponent("stand.json") }

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
}

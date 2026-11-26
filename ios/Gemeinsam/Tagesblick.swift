import CoreGraphics
import EventKit
import Foundation

/// Ein Termin für das große Widget „Notizen & Kalender“ (ab 1.4): so wenig wie nötig, damit die Ablage klein bleibt.
struct WidgetTermin: Codable, Hashable {
    var t: String       // Titel
    var s: Double       // Beginn in Sekunden seit 1970
    var e: Double       // Ende
    var g: Bool         // ganztägig
    var f: String?      // Farbe des Kalenders als #RRGGBB
}

/// Termine von heute bis übermorgen für das große Widget. Liegt in beiden Zielen: Die App legt die Termine zusätzlich in der App-Gruppe ab (termine.json),
/// das Widget liest sie direkt aus dem Kalender, wenn es darf, sonst aus dieser Ablage.
enum Tagesblick {
    static var datei: URL? { Ablage.ordner?.appendingPathComponent("termine.json") }

    /// nil: Track. darf den Kalender nicht lesen, und es liegt nichts ab. Darf es, kommen die Termine direkt aus dem Kalender:
    /// So stimmen sie auch, wenn die App länger nicht offen war. Ob ein Widget den Zugriff der App mitbenutzen darf, ist am Gerät noch nicht belegt; deshalb die Ablage als Rückweg.
    static func lesen(_ jetzt: Date = Date()) -> [WidgetTermin]? {
        if EKEventStore.authorizationStatus(for: .event) == .fullAccess { return ausKalender(EKEventStore(), jetzt) }
        guard let ort = datei, let daten = try? Data(contentsOf: ort) else { return nil }
        return try? JSONDecoder().decode([WidgetTermin].self, from: daten)
    }

    /// Alle Termine, die heute, morgen oder übermorgen stattfinden, nach Beginn
    static func ausKalender(_ lager: EKEventStore, _ jetzt: Date) -> [WidgetTermin] {
        let kalender = Calendar.current, von = kalender.startOfDay(for: jetzt)
        let bis = kalender.date(byAdding: .day, value: 3, to: von) ?? von.addingTimeInterval(3 * 86400)
        let gefunden = lager.events(matching: lager.predicateForEvents(withStart: von, end: bis, calendars: nil))
        var liste: [WidgetTermin] = []
        for termin in gefunden where termin.status != .canceled {
            guard let beginn = termin.startDate, let ende = termin.endDate else { continue }
            liste.append(WidgetTermin(t: String((termin.title ?? "").prefix(80)), s: beginn.timeIntervalSince1970, e: ende.timeIntervalSince1970,
                                      g: termin.isAllDay, f: farbe(termin.calendar?.cgColor)))
        }
        liste.sort { $0.s < $1.s }
        return Array(liste.prefix(60))
    }

    /// Legt die Termine für das Widget ab. true, wenn sich etwas geändert hat (dann zeichnet die App das Widget neu).
    @discardableResult static func merken(_ liste: [WidgetTermin]) -> Bool {
        guard let ort = datei, let daten = try? JSONEncoder().encode(liste), (try? Data(contentsOf: ort)) != daten else { return false }
        return (try? daten.write(to: ort, options: .atomic)) != nil
    }

    /// Farbe eines Kalenders als #RRGGBB
    static func farbe(_ farbe: CGColor?) -> String? {
        guard let farbe = farbe, let raum = CGColorSpace(name: CGColorSpace.sRGB),
              let rgb = farbe.converted(to: raum, intent: .defaultIntent, options: nil), let teile = rgb.components, teile.count >= 3 else { return nil }
        let stufe = { (wert: CGFloat) -> Int in max(0, min(255, Int((wert * 255).rounded()))) }
        return String(format: "#%02X%02X%02X", stufe(teile[0]), stufe(teile[1]), stufe(teile[2]))
    }

    /// Beispiel für die Vorschau beim Hinzufügen und das Bild aus dem Simulator
    static func beispiel(_ jetzt: Date) -> [WidgetTermin] {
        let tag = Calendar.current.startOfDay(for: jetzt)
        let um = { (t: Double, h: Double) -> Double in tag.timeIntervalSince1970 + t * 86400 + h * 3600 }
        return [WidgetTermin(t: "Geburtstag Mama", s: um(0, 0), e: um(1, 0), g: true, f: "#8E8E93"),
                WidgetTermin(t: "Zahnarzt", s: um(0, 14), e: um(0, 15.5), g: false, f: "#FF3B30"),
                WidgetTermin(t: "Seminar Prothetik", s: um(1, 9), e: um(1, 11), g: false, f: "#0A84FF"),
                WidgetTermin(t: "Essen mit Jonas", s: um(1, 19), e: um(1, 22), g: false, f: "#FF9F0A"),
                WidgetTermin(t: "Klausur Kons", s: um(2, 8), e: um(2, 10), g: false, f: "#0A84FF")]
    }
}

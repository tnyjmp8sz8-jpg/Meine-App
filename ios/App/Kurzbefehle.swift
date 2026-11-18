import AppIntents
import Foundation
import WidgetKit

// Aktionen für die App „Kurzbefehle“, Siri und ein Symbol auf dem Home-Bildschirm. Sie laufen, ohne dass Track. aufgeht:
// Was eingetragen wird, merkt die Ablage vor, und die Web-App übernimmt es beim nächsten Öffnen. Das Widget zeigt eine neue Notiz sofort.

/// Sagt der offenen App Bescheid, damit sie Vorgemerktes gleich übernimmt
private func eingangMelden() { NotificationCenter.default.post(name: Halter.eingangDa, object: nil) }

struct NotizHinzufuegen: AppIntent {
    static var title: LocalizedStringResource = "Notiz hinzufügen"
    static var description = IntentDescription("Legt eine Notiz in Track. an, ohne die App zu öffnen.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Text", requestValueDialog: "Was möchtest du notieren?")
    var text: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let sauber = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !sauber.isEmpty else { return .result(dialog: "Die Notiz war leer.") }
        Ablage.notizDazu(sauber)
        // Die Notiz steht schon im Stand für das Widget: gleich neu zeichnen, auch wenn die App nicht offen ist
        WidgetCenter.shared.reloadAllTimelines()
        eingangMelden()
        return .result(dialog: "Notiert.")
    }
}

struct AusgabeEintragen: AppIntent {
    static var title: LocalizedStringResource = "Ausgabe eintragen"
    static var description = IntentDescription("Trägt eine Ausgabe in Track. ein, ohne die App zu öffnen. Ohne Kategorie landet sie unter „Sonstiges“.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Betrag in Euro", requestValueDialog: "Wie viel hast du ausgegeben?")
    var betrag: Double

    @Parameter(title: "Notiz")
    var notiz: String?

    @Parameter(title: "Kategorie")
    var kategorie: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let cent = (betrag * 100).rounded()
        guard cent.isFinite, cent > 0, cent <= 1e9 else { return .result(dialog: "Der Betrag muss über 0 liegen.") }
        Ablage.vormerken(["art": "ausgabe", "a": cent, "n": notiz ?? "", "kat": kategorie ?? ""])
        eingangMelden()
        return .result(dialog: "\(String(format: "%.2f", cent / 100).replacingOccurrences(of: ".", with: ",")) € eingetragen.")
    }
}

/// Für eine Automation in Kurzbefehle: Lauf-Trainings aus Health an Track. übergeben. Derselbe Lauf (gleicher Beginn) wird nur einmal eingetragen.
struct LaufEintragen: AppIntent {
    static var title: LocalizedStringResource = "Lauf eintragen"
    static var description = IntentDescription("Trägt einen Lauf in Track. ein, ohne die App zu öffnen. Gedacht für Trainings aus Health.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Beginn")
    var beginn: Date

    @Parameter(title: "Strecke", defaultUnit: .kilometers)
    var strecke: Measurement<UnitLength>

    @Parameter(title: "Dauer", defaultUnit: .minutes)
    var dauer: Measurement<UnitDuration>

    @Parameter(title: "Puls")
    var puls: Double?

    @Parameter(title: "Laufband", default: false)
    var laufband: Bool

    func perform() async throws -> some IntentResult {
        let meter = strecke.converted(to: .meters).value, sekunden = dauer.converted(to: .seconds).value
        let start = beginn.timeIntervalSince1970 * 1000, kennung = "k\(Int(start / 60000))"
        guard meter.isFinite, sekunden.isFinite, meter >= 50, sekunden >= 10 else { return .result() }
        // Schon vorgemerkt (die Automation läuft öfter über dieselben Trainings): nicht noch einmal
        let schonDa = Ablage.eingang().contains { ($0["lauf"] as? [String: Any])?["id"] as? String == kennung }
        if !schonDa {
            var lauf: [String: Any] = ["id": kennung, "t": start, "m": meter, "s": sekunden, "k": laufband ? "in" : "out"]
            if let puls = puls, puls.isFinite, puls > 0 { lauf["hr"] = puls }
            Ablage.vormerken(["art": "lauf", "lauf": lauf])
            eingangMelden()
        }
        return .result()
    }
}

/// Damit „Notiz“ und „Ausgabe“ ohne Einrichten in Kurzbefehle und in der Suche stehen
struct TrackKurzbefehle: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: NotizHinzufuegen(), phrases: ["Notiz in \(.applicationName)", "Neue Notiz in \(.applicationName)"], shortTitle: "Notiz", systemImageName: "note.text")
        AppShortcut(intent: AusgabeEintragen(), phrases: ["Ausgabe in \(.applicationName)", "Neue Ausgabe in \(.applicationName)"], shortTitle: "Ausgabe", systemImageName: "creditcard")
    }
}

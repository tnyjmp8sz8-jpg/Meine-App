import AppIntents
import Foundation
import WidgetKit

// Aktionen für die App „Kurzbefehle“, Siri und ein Symbol auf dem Home-Bildschirm. Sie laufen, ohne dass Track. aufgeht:
// Was eingetragen wird, merkt die Ablage vor, und die Web-App übernimmt es beim nächsten Öffnen. Das Widget zeigt eine neue Notiz sofort.
// Die Aktionen für Läufe von der Apple Watch stehen in Uhr.swift.

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

/// Damit „Notiz“ und „Ausgabe“ ohne Einrichten in Kurzbefehle und in der Suche stehen
struct TrackKurzbefehle: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: NotizHinzufuegen(), phrases: ["Notiz in \(.applicationName)", "Neue Notiz in \(.applicationName)"], shortTitle: "Notiz", systemImageName: "note.text")
        AppShortcut(intent: AusgabeEintragen(), phrases: ["Ausgabe in \(.applicationName)", "Neue Ausgabe in \(.applicationName)"], shortTitle: "Ausgabe", systemImageName: "creditcard")
    }
}

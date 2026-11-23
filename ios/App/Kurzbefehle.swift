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
    static var description = IntentDescription("Trägt eine Ausgabe in Track. ein, ohne die App zu öffnen. Ohne Kategorie gilt die, unter der die Notiz (der Händler) zuletzt einsortiert wurde; bei einem neuen Händler fragt Track. nach. Mit dem Namen eines Kontos zählt sie bei diesem Konto.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Betrag in Euro", requestValueDialog: "Wie viel hast du ausgegeben?")
    var betrag: Double

    @Parameter(title: "Notiz")
    var notiz: String?

    @Parameter(title: "Kategorie")
    var kategorie: String?

    /// Name eines Kontos, wie er in der App steht. Für die Automation „bei jeder Zahlung mit Apple Pay“: So landet die Ausgabe immer beim selben Konto.
    @Parameter(title: "Konto")
    var konto: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let cent = (betrag * 100).rounded()
        guard cent.isFinite, cent > 0, cent <= 1e9 else { return .result(dialog: "Der Betrag muss über 0 liegen.") }
        var auftrag: [String: Any] = ["art": "ausgabe", "a": cent, "n": notiz ?? "", "kat": kategorie ?? ""]
        // Das Konto wird nach seinem Namen gesucht (Groß und klein egal). Ohne Angabe oder ohne Treffer wählt die Web-App wie im Blatt: das zuletzt benutzte Konto.
        let name = (konto ?? "").trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !name.isEmpty, let treffer = Ablage.lesen()?.konten?.first(where: { $0.n.lowercased() == name }) { auftrag["acc"] = treffer.id }
        let id = Ablage.vormerken(auftrag)
        eingangMelden()
        // Nachfrage beim Bezahlen (ab 0.9): Ist keine Kategorie mitgegeben und der Händler noch nie einsortiert worden, zeigt iOS die Kategorien zur Auswahl.
        // Die Ausgabe ist da schon vorgemerkt: Wer die Frage übergeht oder wegwischt, verliert nichts; sie landet dann unter „Sonstiges“.
        // Die Wahl geht als Nachtrag zum selben Auftrag hinterher. Beim nächsten Mal kennt die Web-App den Händler und fragt nicht mehr.
        var gewaehlt = ""
        let stand = Ablage.lesen(), kats = stand?.kats ?? []
        let haendler = (notiz ?? "").trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if (kategorie ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !kats.isEmpty, !(stand?.haendler ?? []).contains(haendler) {
            let frage: IntentDialog = haendler.isEmpty ? "Welche Kategorie?" : "Welche Kategorie für \(notiz ?? "")?"
            let wahl: String? = try? await $kategorie.requestDisambiguation(among: kats.map { $0.n }, dialog: frage)
            if let wahl, let k = kats.first(where: { $0.n == wahl }) {
                Ablage.vormerken(["art": "kat", "zu": id, "kid": k.id])
                eingangMelden()
                gewaehlt = " unter „\(k.n)“"
            }
        }
        return .result(dialog: "\(String(format: "%.2f", cent / 100).replacingOccurrences(of: ".", with: ",")) €\(gewaehlt) eingetragen.")
    }
}

/// Damit „Notiz“ und „Ausgabe“ ohne Einrichten in Kurzbefehle und in der Suche stehen
struct TrackKurzbefehle: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: NotizHinzufuegen(), phrases: ["Notiz in \(.applicationName)", "Neue Notiz in \(.applicationName)"], shortTitle: "Notiz", systemImageName: "note.text")
        AppShortcut(intent: AusgabeEintragen(), phrases: ["Ausgabe in \(.applicationName)", "Neue Ausgabe in \(.applicationName)"], shortTitle: "Ausgabe", systemImageName: "creditcard")
    }
}

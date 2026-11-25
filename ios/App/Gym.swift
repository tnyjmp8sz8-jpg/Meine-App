import AppIntents
import Foundation

// Gym-Einheiten von der Apple Watch (ab 1.0), nach demselben Muster wie die Läufe (Uhr.swift), nur einfacher: Es gibt keine Strecke.
// „Gym merken“ läuft, wenn auf der Uhr ein Krafttraining beginnt oder endet. Die Aktion merkt nur die Uhrzeit und geht deshalb auch bei gesperrtem iPhone.
// „Gym-Zeitraum“ und „Gym eintragen“ laufen, wenn Track. geöffnet wird: Die erste nennt Beginn und Ende, Kurzbefehle sucht dazu den Puls in Health,
// die zweite nimmt ihn an und merkt das Training für die Web-App vor (Eingang, art „gym“). Die Web-App legt Dauer und Puls zum Tag ab (K.uhr, gymUhr()).
// Die Sätze kommen weiter aus der App: Von der Uhr kommen nur Dauer und Puls.
enum Gymbuch {
    struct Fenster: Codable, Equatable {
        var von: Double            // Beginn, ms seit 1970
        var bis: Double            // Ende
        var lesungen: Int          // wie oft Werte dazu ankamen
        var gelesen: Double        // wann zuletzt
        var puls: Double           // Mittel der Pulswerte der letzten Lesung; 0 = keiner
    }

    struct Buch: Codable, Equatable {
        var offen: Double          // Beginn eines Trainings, dessen Ende aussteht; 0 = keines
        var fenster: [Fenster]     // erkannte Trainings, ältestes zuerst, höchstens 20
        var aus: Double            // Beginn des Zeitraums, den „Gym-Zeitraum“ zuletzt genannt hat
        var ausZeit: Double        // wann
        static let leer = Buch(offen: 0, fenster: [], aus: 0, ausZeit: 0)
    }

    static let laenge = 5.0 * 3_600_000    // länger dauert kein Training: Eine Meldung danach ist ein neuer Beginn
    static let kurz = 300_000.0            // kürzer als fünf Minuten ist kein Training (auf der Uhr versehentlich gestartet)
    static let ruhe = 20.0 * 60_000        // wer früher nach dem Ende liest, hat vielleicht noch nicht alles von der Uhr
    static let woche = 7.0 * 86_400_000    // ältere Trainings werden nicht mehr nachgefragt

    /// Reine Rechnung (der Selbsttest prüft sie): eine Meldung der Uhr. was: "b" Beginn, "e" Ende, sonst abwechselnd (wie Laufbuch.melden).
    static func melden(_ buch: inout Buch, t: Double, was: String) {
        if buch.offen > 0, was != "b", t >= buch.offen, t - buch.offen <= laenge {
            if t - buch.offen >= kurz { buch.fenster.append(Fenster(von: buch.offen, bis: t, lesungen: 0, gelesen: 0, puls: 0)) }
            buch.offen = 0
        } else if was != "e" {
            buch.offen = t
        }
        if buch.fenster.count > 20 { buch.fenster.removeFirst(buch.fenster.count - 20) }
    }

    /// Reine Rechnung: Welchen Zeitraum soll der Kurzbefehl als Nächstes lesen? Es gibt immer einen (siehe Laufbuch.waehlen).
    static func waehlen(_ buch: Buch, jetzt: Double) -> (von: Double, bis: Double) {
        let frisch = buch.fenster.filter { jetzt - $0.bis < woche }
        // 1. Trainings, zu denen noch kein Puls kam: das mit den wenigsten Versuchen zuerst, höchstens sechs Versuche
        let ohne = frisch.filter { $0.puls <= 0 && $0.lesungen < 6 }
        if let f = ohne.min(by: { $0.lesungen != $1.lesungen ? $0.lesungen < $1.lesungen : $0.von < $1.von }) { return (f.von, f.bis) }
        // 2. Trainings, die bisher nur kurz nach ihrem Ende gelesen wurden: Die Uhr kann seitdem nachgeliefert haben
        if let f = frisch.first(where: { $0.puls > 0 && $0.gelesen - $0.bis < ruhe }) { return (f.von, f.bis) }
        // 3. Sonst das neueste noch einmal
        if let f = buch.fenster.last { return (f.von, f.bis) }
        // Noch gar kein Training: die letzten 24 Stunden (die Werte werden dann nicht verwendet)
        return (jetzt - 86_400_000, jetzt)
    }

    /// Reine Rechnung: Pulswerte aus dem Kurzbefehl. Liefert das Training für die Web-App, wenn der Puls neu ist, sonst nil.
    /// Ohne Beginn und Ende gehören die Werte zu dem Zeitraum, den „Gym-Zeitraum“ in den letzten zehn Minuten genannt hat.
    static func werte(_ buch: inout Buch, puls: [Double], beginn: Double?, ende: Double?, jetzt: Double) -> [String: Any]? {
        var von = buch.aus
        if let b = beginn, let e = ende {
            guard e - b >= kurz, e - b <= laenge, e <= jetzt + 60_000 else { return nil }
            von = b
            if !buch.fenster.contains(where: { $0.von == b }) {
                buch.fenster.append(Fenster(von: b, bis: e, lesungen: 0, gelesen: 0, puls: 0))
                buch.fenster.sort { $0.von < $1.von }
            }
        } else if jetzt - buch.ausZeit > 600_000 {
            return nil
        }
        guard let i = buch.fenster.firstIndex(where: { $0.von == von }) else { return nil }
        let schlaege = puls.filter { $0.isFinite && $0 > 0 }
        let mittel = schlaege.isEmpty ? 0 : schlaege.reduce(0, +) / Double(schlaege.count)
        var f = buch.fenster[i]
        let neu = mittel > 0 && mittel != f.puls
        // Schon in Ruhe gelesen und nichts Neues (der übliche Fall bei jedem Öffnen der App): nichts merken, nichts schreiben
        if !neu, mittel > 0, f.gelesen - f.bis >= ruhe { return nil }
        f.lesungen += 1
        f.gelesen = jetzt
        if mittel > 0 { f.puls = mittel }
        buch.fenster[i] = f
        guard neu else { return nil }
        // Kennung: g + Minute des Beginns. Die Web-App bessert nach, wenn dieselbe Kennung noch einmal kommt.
        let training: [String: Any] = ["id": "g\(Int(f.von / 60000))", "t": f.von, "s": ((f.bis - f.von) / 1000).rounded(), "pu": Array(schlaege.prefix(2000))]
        return training
    }

    // Ablage: eine kleine Datei im Ordner der App. Gelesen und geschrieben wird der Reihe nach.
    private static let reihe = DispatchQueue(label: "de.trackapp.track.gymbuch")
    private static var datei: URL {
        let ordner = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: ordner, withIntermediateDirectories: true)
        return ordner.appendingPathComponent("gymbuch.json")
    }
    private static var jetzt: Double { Date().timeIntervalSince1970 * 1000 }

    private static func lesen() -> Buch {
        guard let daten = try? Data(contentsOf: datei), let buch = try? JSONDecoder().decode(Buch.self, from: daten) else { return .leer }
        return buch
    }

    private static func aendern<Ergebnis>(_ tun: (inout Buch) -> Ergebnis) -> Ergebnis {
        return reihe.sync { () -> Ergebnis in
            var buch = lesen()
            let alt = buch
            let ergebnis = tun(&buch)
            // Ohne zusätzlichen Schutz der Datei: „Gym merken“ schreibt auch bei gesperrtem iPhone
            if buch != alt, let daten = try? JSONEncoder().encode(buch) {
                try? daten.write(to: datei, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
            }
            return ergebnis
        }
    }

    static func merke(_ was: String) {
        let t = jetzt
        aendern { (buch: inout Buch) in melden(&buch, t: t, was: was) }
        NotificationCenter.default.post(name: Halter.eingangDa, object: nil)   // ist die App gerade offen, zeigt sie den neuen Stand
    }

    static func zeitraum() -> (von: Date, bis: Date) {
        let t = jetzt
        let f = aendern { (buch: inout Buch) -> (von: Double, bis: Double) in
            let wahl = waehlen(buch, jetzt: t)
            buch.aus = wahl.von
            buch.ausZeit = t
            return wahl
        }
        return (Date(timeIntervalSince1970: f.von / 1000), Date(timeIntervalSince1970: f.bis / 1000))
    }

    static func eintragen(puls: [Double], beginn: Date?, ende: Date?) {
        // Ohne gemeinsamen Ordner ließe sich nichts vormerken: Dann auch nichts als gelesen merken, der nächste Versuch holt es nach
        guard Ablage.ordner != nil else { return }
        let t = jetzt
        let b = beginn.map { $0.timeIntervalSince1970 * 1000 }
        let e = ende.map { $0.timeIntervalSince1970 * 1000 }
        let training = aendern { (buch: inout Buch) -> [String: Any]? in
            werte(&buch, puls: puls, beginn: b, ende: e, jetzt: t)
        }
        if let training = training { Ablage.vormerken(["art": "gym", "gym": training]) }
        NotificationCenter.default.post(name: Halter.eingangDa, object: nil)
    }

    /// Für die Web-App (info, Feld „gym“): die letzten erkannten Trainings und ob ein Puls dazu ankam. Daraus zeichnet sie die Zeile „Apple Watch“ im Blatt der Einheit.
    static var auskunft: [String: Any] {
        let buch = reihe.sync { lesen() }
        let letzte: [[String: Any]] = buch.fenster.suffix(3).map { ["von": $0.von, "bis": $0.bis, "lesungen": $0.lesungen, "puls": $0.puls.rounded()] }
        return ["offen": buch.offen, "letzte": letzte]
    }

    /// Selbsttest, reine Rechnung mit festen Zahlen. Erwartet: "1|3600|g30000000|true"
    /// Ein Training von einer Stunde. Am nächsten Tag ein Start von 60 s (unter fünf Minuten, kein Training): Es bleibt 1 Training.
    /// Gelesen wird es mit Puls 120 und 130: 3600 s, Kennung g + 1 800 000 000 000 / 60 000 = g30000000. Dieselben Werte noch einmal ergeben nichts Neues.
    static func pruefung() -> String {
        let t = 1_800_000_000_000.0, tag = 86_400_000.0
        var buch = Buch.leer
        melden(&buch, t: t, was: ""); melden(&buch, t: t + 3_600_000, was: "")
        melden(&buch, t: t + tag, was: ""); melden(&buch, t: t + tag + 60_000, was: "")
        let nun = t + tag + 100_000
        buch.aus = waehlen(buch, jetzt: nun).von
        buch.ausZeit = nun
        let erstes = werte(&buch, puls: [120, 130], beginn: nil, ende: nil, jetzt: nun)
        let nochmal = werte(&buch, puls: [120, 130], beginn: nil, ende: nil, jetzt: nun)
        let sekunden = Int((erstes?["s"] as? Double) ?? -1)
        let kennung = (erstes?["id"] as? String) ?? ""
        return "\(buch.fenster.count)|\(sekunden)|\(kennung)|\(nochmal == nil)"
    }

    /// Selbsttest im Simulator (vor dem Laden der Seite, wie Laufbuch.probe): stellt nach, was die Kurzbefehle liefern.
    /// Erster Start: Training von vor 40 bis vor 10 Minuten (1800 s), Puls 120 und 130. Zweiter Start: dieselbe Lesung mit 130 und 140 (die Uhr hat nachgeliefert).
    /// Dritter Start: unverändert. Danach steht in der Web-App für heute genau ein Training: 1800 s, Puls 135.
    static func probe() {
        let t = jetzt
        let leerNoch = reihe.sync { lesen() }.fenster.isEmpty
        if leerNoch { aendern { (buch: inout Buch) in melden(&buch, t: t - 2_400_000, was: ""); melden(&buch, t: t - 600_000, was: "") } }
        let erstes = reihe.sync { lesen() }.fenster.first?.lesungen == 0
        _ = zeitraum()
        eintragen(puls: erstes ? [120, 130] : [130, 140], beginn: nil, ende: nil)
    }
}

// Aktionen für Kurzbefehle. Ihre Namen (GymMerken, GymZeitraum, GymEintragen) und die Namen ihrer Felder stehen in den Kurzbefehlen des Nutzers:
// Sobald er sie angelegt hat, dürfen sie sich nicht mehr ändern.

/// Für die Automation „Apple Watch-Training beginnt oder endet“ (Krafttraining). Liest kein Health und zeigt nichts: läuft deshalb auch bei gesperrtem iPhone.
struct GymMerken: AppIntent {
    static var title: LocalizedStringResource = "Gym merken"
    static var description = IntentDescription("Merkt, wann ein Krafttraining auf der Apple Watch beginnt und endet. Für die Automation „Apple Watch-Training“.")
    static var openAppWhenRun: Bool = false
    static var authenticationPolicy: IntentAuthenticationPolicy = .alwaysAllowed

    @Parameter(title: "Ereignis", default: .automatisch)
    var ereignis: LaufEreignis

    static var parameterSummary: some ParameterSummary {
        Summary("Gym merken") {
            \.$ereignis
        }
    }

    func perform() async throws -> some IntentResult {
        Gymbuch.merke(ereignis == .beginn ? "b" : ereignis == .ende ? "e" : "")
        return .result()
    }
}

/// Was „Gym-Zeitraum“ zurückgibt: In Kurzbefehle lassen sich „Beginn“ und „Ende“ einzeln in den Filter von „Health-Messungen suchen“ setzen.
struct GymZeit: TransientAppEntity {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Gym-Zeitraum")

    @Property(title: "Beginn")
    var beginn: Date

    @Property(title: "Ende")
    var ende: Date

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "Gym-Zeitraum")
    }

    init() {}
}

struct GymZeitraum: AppIntent {
    static var title: LocalizedStringResource = "Gym-Zeitraum"
    static var description = IntentDescription("Nennt Beginn und Ende des Krafttrainings, zu dem Track. den Puls braucht. Für den Filter von „Health-Messungen suchen“.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ReturnsValue<GymZeit> {
        let f = Gymbuch.zeitraum()
        var zeit = GymZeit()
        zeit.beginn = f.von
        zeit.ende = f.bis
        return .result(value: zeit)
    }
}

/// Kein Feld ist Pflicht: Im Hintergrund kann Kurzbefehle nicht nachfragen, und ein leeres Ergebnis aus Health darf nichts auslösen.
struct GymEintragen: AppIntent {
    static var title: LocalizedStringResource = "Gym eintragen"
    static var description = IntentDescription("Trägt den Puls zu einem Krafttraining ein, ohne die App zu öffnen. Ohne Beginn und Ende gilt der Zeitraum aus „Gym-Zeitraum“.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Puls")
    var puls: [Double]?

    @Parameter(title: "Beginn")
    var beginn: Date?

    @Parameter(title: "Ende")
    var ende: Date?

    static var parameterSummary: some ParameterSummary {
        Summary("Gym eintragen: Puls \(\.$puls)") {
            \.$beginn
            \.$ende
        }
    }

    func perform() async throws -> some IntentResult {
        Gymbuch.eintragen(puls: puls ?? [], beginn: beginn, ende: ende)
        return .result()
    }
}

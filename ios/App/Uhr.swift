import AppIntents
import Foundation

// Läufe von der Apple Watch, ohne dass die App Health lesen darf (mit AltStore und kostenloser Apple-ID fehlt die Freigabe).
// Zwei Kurzbefehle liefern, was fehlt:
// „Lauf merken“ läuft, wenn auf der Uhr ein Lauf beginnt oder endet. Die Aktion merkt nur die Uhrzeit: Sie liest kein Health und geht deshalb auch bei gesperrtem iPhone.
// „Lauf-Zeitraum“ und „Lauf eintragen“ laufen, wenn Track. geöffnet wird (dann ist das iPhone entsperrt): Die erste nennt Beginn und Ende,
// Kurzbefehle sucht dazu Strecke und Puls in Health, die zweite nimmt sie an und merkt den Lauf für die Web-App vor (Eingang, wie Widget und Schnelleingabe).
// Gerechnet (Einheit, Mittel, Laufband, doppelte Läufe) wird in der Web-App: Dort lässt es sich nachbessern, ohne neue Installation.
// Hier steht nur, was feststehen muss, bevor die Web-App offen ist: welche Läufe es gab und welcher als Nächstes gelesen wird.
enum Laufbuch {
    struct Fenster: Codable, Equatable {
        var von: Double            // Beginn, ms seit 1970
        var bis: Double            // Ende
        var lesungen: Int          // wie oft Werte dazu ankamen
        var gelesen: Double        // wann zuletzt
        var summe: Double          // Strecke der letzten Lesung, so wie sie kam (Einheit der Aktion in Kurzbefehle, bei uns km); 0 = noch keine
        var puls: Double           // Mittel der Pulswerte der letzten Lesung; 0 = keiner
    }

    struct Buch: Codable, Equatable {
        var offen: Double          // Beginn eines Laufs, dessen Ende aussteht; 0 = keiner
        var fenster: [Fenster]     // erkannte Läufe, ältester zuerst, höchstens 20
        var aus: Double            // Beginn des Zeitraums, den „Lauf-Zeitraum“ zuletzt genannt hat
        var ausZeit: Double        // wann
        static let leer = Buch(offen: 0, fenster: [], aus: 0, ausZeit: 0)
    }

    static let laenge = 4.0 * 3_600_000    // länger dauert kein Lauf: Eine Meldung danach ist ein neuer Beginn
    static let kurz = 30_000.0             // kürzer ist kein Lauf (auf der Uhr versehentlich gestartet)
    static let ruhe = 20.0 * 60_000        // wer früher nach dem Ende liest, hat vielleicht noch nicht alles von der Uhr
    static let woche = 7.0 * 86_400_000    // ältere Läufe werden nicht mehr nachgefragt

    /// Reine Rechnung (der Selbsttest prüft sie): eine Meldung der Uhr. was: "b" Beginn, "e" Ende, sonst abwechselnd.
    /// Abwechselnd heißt: Steht ein Beginn offen und ist er höchstens vier Stunden alt, ist die Meldung sein Ende; sonst ist sie ein neuer Beginn.
    /// Fehlt einmal eine Meldung, geht so höchstens dieser eine Lauf verloren.
    static func melden(_ buch: inout Buch, t: Double, was: String) {
        if buch.offen > 0, was != "b", t >= buch.offen, t - buch.offen <= laenge {
            if t - buch.offen >= kurz { buch.fenster.append(Fenster(von: buch.offen, bis: t, lesungen: 0, gelesen: 0, summe: 0, puls: 0)) }
            buch.offen = 0
        } else if was != "e" {
            buch.offen = t
        }
        if buch.fenster.count > 20 { buch.fenster.removeFirst(buch.fenster.count - 20) }
    }

    /// Reine Rechnung: Welchen Zeitraum soll der Kurzbefehl als Nächstes lesen? Es gibt immer einen: Mit einem leeren Datum im Filter läse Kurzbefehle womöglich alles.
    static func waehlen(_ buch: Buch, jetzt: Double) -> (von: Double, bis: Double) {
        let frisch = buch.fenster.filter { jetzt - $0.bis < woche }
        // 1. Läufe, zu denen noch keine Strecke kam. Der mit den wenigsten Versuchen zuerst (ein Lauf ohne Daten hält so die anderen nicht auf), höchstens sechs Versuche.
        let ohne = frisch.filter { $0.summe <= 0 && $0.lesungen < 6 }
        if let f = ohne.min(by: { $0.lesungen != $1.lesungen ? $0.lesungen < $1.lesungen : $0.von < $1.von }) { return (f.von, f.bis) }
        // 2. Läufe, die bisher nur kurz nach ihrem Ende gelesen wurden: Die Uhr kann seitdem nachgeliefert haben.
        if let f = frisch.first(where: { $0.summe > 0 && $0.gelesen - $0.bis < ruhe }) { return (f.von, f.bis) }
        // 3. Sonst der neueste Lauf noch einmal: Es ändert sich nichts, aber der Kurzbefehl geht immer denselben Weg und findet immer Werte.
        if let f = buch.fenster.last { return (f.von, f.bis) }
        // Noch gar kein Lauf: die letzten 24 Stunden (die Werte werden dann nicht verwendet).
        return (jetzt - 86_400_000, jetzt)
    }

    /// Reine Rechnung: Werte aus dem Kurzbefehl. Liefert den Lauf für die Web-App, wenn Strecke oder Puls neu sind, sonst nil.
    /// Ohne Beginn und Ende gehören die Werte zu dem Zeitraum, den „Lauf-Zeitraum“ in den letzten zehn Minuten genannt hat.
    /// Mit Beginn und Ende (aus dem Kurzbefehl selbst) braucht es „Lauf merken“ und „Lauf-Zeitraum“ nicht.
    static func werte(_ buch: inout Buch, strecke: [Double], puls: [Double], beginn: Double?, ende: Double?, art: String, jetzt: Double) -> [String: Any]? {
        var von = buch.aus
        if let b = beginn, let e = ende {
            guard e - b >= kurz, e - b <= laenge, e <= jetzt + 60_000 else { return nil }
            von = b
            if !buch.fenster.contains(where: { $0.von == b }) {
                buch.fenster.append(Fenster(von: b, bis: e, lesungen: 0, gelesen: 0, summe: 0, puls: 0))
                buch.fenster.sort { $0.von < $1.von }
            }
        } else if jetzt - buch.ausZeit > 600_000 {
            return nil
        }
        guard let i = buch.fenster.firstIndex(where: { $0.von == von }) else { return nil }
        let km = strecke.filter { $0.isFinite && $0 > 0 }
        let schlaege = puls.filter { $0.isFinite && $0 > 0 }
        let summe = km.reduce(0, +)
        let mittel = schlaege.isEmpty ? 0 : schlaege.reduce(0, +) / Double(schlaege.count)
        var f = buch.fenster[i]
        // Neu ist eine andere Strecke oder ein anderer Puls. Ein Puls, der einmal da war, geht nicht verloren, wenn später keiner mitkommt.
        let neu = summe > 0 && (summe != f.summe || (mittel > 0 && mittel != f.puls))
        // Schon in Ruhe gelesen und nichts Neues (der übliche Fall bei jedem Öffnen der App): nichts merken, nichts schreiben
        if !neu, summe > 0, f.gelesen - f.bis >= ruhe { return nil }
        f.lesungen += 1
        f.gelesen = jetzt
        if summe > 0 { f.summe = summe }
        if mittel > 0 { f.puls = mittel }
        buch.fenster[i] = f
        guard neu else { return nil }
        // Kennung wie bei trackpunkt://lauf: k + Minute des Beginns. Die Web-App bildet dieselbe (Math.floor(von / 60000)).
        var lauf: [String: Any] = ["id": "k\(Int(f.von / 60000))", "t": f.von, "s": ((f.bis - f.von) / 1000).rounded(), "km": km, "pu": Array(schlaege.prefix(2000))]
        if art == "in" || art == "out" { lauf["k"] = art }
        return lauf
    }

    // Ablage: eine kleine Datei im Ordner der App. Gelesen und geschrieben wird der Reihe nach.
    private static let reihe = DispatchQueue(label: "de.trackapp.track.laufbuch")
    private static var datei: URL {
        let ordner = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: ordner, withIntermediateDirectories: true)
        return ordner.appendingPathComponent("laufbuch.json")
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
            // Ohne zusätzlichen Schutz der Datei: „Lauf merken“ schreibt auch bei gesperrtem iPhone
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

    static func eintragen(strecke: [Double], puls: [Double], beginn: Date?, ende: Date?, art: String) {
        // Ohne gemeinsamen Ordner ließe sich nichts vormerken: Dann auch nichts als gelesen merken, der nächste Versuch holt es nach
        guard Ablage.ordner != nil else { return }
        let t = jetzt
        let b = beginn.map { $0.timeIntervalSince1970 * 1000 }
        let e = ende.map { $0.timeIntervalSince1970 * 1000 }
        let lauf = aendern { (buch: inout Buch) -> [String: Any]? in
            werte(&buch, strecke: strecke, puls: puls, beginn: b, ende: e, art: art, jetzt: t)
        }
        if let lauf = lauf { Ablage.vormerken(["art": "lauf", "lauf": lauf]) }
        NotificationCenter.default.post(name: Halter.eingangDa, object: nil)
    }

    /// Für die Web-App (info, Feld „uhr“): was zuletzt erkannt wurde und ob Werte ankamen. Daraus zeichnet sie die Zeile „Apple Watch“.
    static var auskunft: [String: Any] {
        let buch = reihe.sync { lesen() }
        let letzte: [[String: Any]] = buch.fenster.suffix(3).map { ["von": $0.von, "bis": $0.bis, "lesungen": $0.lesungen, "km": $0.summe, "puls": $0.puls.rounded()] }
        return ["n": buch.fenster.count, "offen": buch.offen, "letzte": letzte]
    }

    /// Selbsttest, reine Rechnung mit festen Zahlen. Erwartet: "2|2713|k30000000|true|true"
    /// Lauf 1 dauert 2713 s. Am nächsten Tag ein Start von 10 s (kein Lauf), dann Lauf 2 mit 1800 s. Zwei Tage später ein Beginn ohne Ende, tags darauf ein neuer Beginn:
    /// Es bleiben 2 Läufe. Gelesen wird zuerst der ältere (Kennung k + 1 800 000 000 000 / 60 000 = k30000000), danach der zweite; dieselben Werte noch einmal ergeben nichts Neues.
    static func pruefung() -> String {
        let t = 1_800_000_000_000.0, tag = 86_400_000.0
        var buch = Buch.leer
        melden(&buch, t: t, was: ""); melden(&buch, t: t + 2_713_000, was: "")
        melden(&buch, t: t + tag, was: ""); melden(&buch, t: t + tag + 10_000, was: "")
        melden(&buch, t: t + tag + 60_000, was: ""); melden(&buch, t: t + tag + 1_860_000, was: "")
        melden(&buch, t: t + 3 * tag, was: ""); melden(&buch, t: t + 4 * tag, was: "")
        let nun = t + 4 * tag + 1000
        buch.aus = waehlen(buch, jetzt: nun).von
        buch.ausZeit = nun
        let erster = werte(&buch, strecke: [5.62], puls: [150, 153], beginn: nil, ende: nil, art: "", jetzt: nun)
        let zweiter = waehlen(buch, jetzt: nun).von == t + tag + 60_000
        buch.aus = t
        let nochmal = werte(&buch, strecke: [5.62], puls: [150, 153], beginn: nil, ende: nil, art: "", jetzt: nun)
        let sekunden = Int((erster?["s"] as? Double) ?? -1)
        let kennung = (erster?["id"] as? String) ?? ""
        return "\(buch.fenster.count)|\(sekunden)|\(kennung)|\(zweiter)|\(nochmal == nil)"
    }

    /// Selbsttest im Simulator (vor dem Laden der Seite, wie Halter.probeEingang): stellt nach, was die zwei Kurzbefehle liefern.
    /// Erster Start: Lauf von vor zehn bis vor fünf Minuten (300 s), 0,80 km, Puls 140 und 150. Zweiter Start: dieselbe Lesung mit 0,85 km (die Uhr hat nachgeliefert).
    /// Dritter Start: unverändert. Danach steht in der Web-App genau ein Lauf: 850 m, 300 s, Puls 145.
    static func probe() {
        let t = jetzt
        let leerNoch = reihe.sync { lesen() }.fenster.isEmpty
        if leerNoch { aendern { (buch: inout Buch) in melden(&buch, t: t - 600_000, was: ""); melden(&buch, t: t - 300_000, was: "") } }
        let erstes = reihe.sync { lesen() }.fenster.first?.lesungen == 0
        _ = zeitraum()
        eintragen(strecke: [erstes ? 0.80 : 0.85], puls: [140, 150], beginn: nil, ende: nil, art: "")
    }
}

// Aktionen für Kurzbefehle. Ihre Namen (LaufMerken, LaufZeitraum, LaufEintragen) und die Namen ihrer Felder stehen in den Kurzbefehlen des Nutzers:
// Sobald er sie angelegt hat, dürfen sie sich nicht mehr ändern.

enum LaufEreignis: String, AppEnum {
    case automatisch, beginn, ende
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Ereignis")
    static var caseDisplayRepresentations: [LaufEreignis: DisplayRepresentation] = [.automatisch: "Automatisch", .beginn: "Beginn", .ende: "Ende"]
}

enum LaufArt: String, AppEnum {
    case wieZuletzt, laufband, draussen
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Art")
    static var caseDisplayRepresentations: [LaufArt: DisplayRepresentation] = [.wieZuletzt: "Wie der letzte Lauf", .laufband: "Laufband", .draussen: "Draußen"]
}

/// Für die Automation „Apple Watch-Training beginnt oder endet“. Liest kein Health und zeigt nichts: läuft deshalb auch bei gesperrtem iPhone.
struct LaufMerken: AppIntent {
    static var title: LocalizedStringResource = "Lauf merken"
    static var description = IntentDescription("Merkt, wann ein Lauf auf der Apple Watch beginnt und endet. Für die Automation „Apple Watch-Training“.")
    static var openAppWhenRun: Bool = false
    static var authenticationPolicy: IntentAuthenticationPolicy = .alwaysAllowed

    @Parameter(title: "Ereignis", default: .automatisch)
    var ereignis: LaufEreignis

    static var parameterSummary: some ParameterSummary {
        Summary("Lauf merken") {
            \.$ereignis
        }
    }

    func perform() async throws -> some IntentResult {
        Laufbuch.merke(ereignis == .beginn ? "b" : ereignis == .ende ? "e" : "")
        return .result()
    }
}

/// Was „Lauf-Zeitraum“ zurückgibt: In Kurzbefehle lassen sich „Beginn“ und „Ende“ einzeln in den Filter von „Health-Messungen suchen“ setzen.
struct LaufZeit: TransientAppEntity {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Lauf-Zeitraum")

    @Property(title: "Beginn")
    var beginn: Date

    @Property(title: "Ende")
    var ende: Date

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "Lauf-Zeitraum")
    }

    init() {}
}

struct LaufZeitraum: AppIntent {
    static var title: LocalizedStringResource = "Lauf-Zeitraum"
    static var description = IntentDescription("Nennt Beginn und Ende des Laufs, zu dem Track. Strecke und Puls braucht. Für den Filter von „Health-Messungen suchen“.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ReturnsValue<LaufZeit> {
        let f = Laufbuch.zeitraum()
        var zeit = LaufZeit()
        zeit.beginn = f.von
        zeit.ende = f.bis
        return .result(value: zeit)
    }
}

/// Ersetzt die bisherige Aktion „Lauf eintragen“ (Beginn, Strecke, Dauer als Pflichtfelder). Jetzt ist kein Feld Pflicht:
/// Im Hintergrund kann Kurzbefehle nicht nachfragen, und ein leeres Ergebnis aus Health darf nichts auslösen.
struct LaufEintragen: AppIntent {
    static var title: LocalizedStringResource = "Lauf eintragen"
    static var description = IntentDescription("Trägt Strecke (in km) und Puls zu einem Lauf ein, ohne die App zu öffnen. Ohne Beginn und Ende gilt der Zeitraum aus „Lauf-Zeitraum“.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Strecke")
    var strecke: [Double]?

    @Parameter(title: "Puls")
    var puls: [Double]?

    @Parameter(title: "Art", default: .wieZuletzt)
    var art: LaufArt

    @Parameter(title: "Beginn")
    var beginn: Date?

    @Parameter(title: "Ende")
    var ende: Date?

    static var parameterSummary: some ParameterSummary {
        Summary("Lauf eintragen: Strecke \(\.$strecke), Puls \(\.$puls)") {
            \.$art
            \.$beginn
            \.$ende
        }
    }

    func perform() async throws -> some IntentResult {
        Laufbuch.eintragen(strecke: strecke ?? [], puls: puls ?? [], beginn: beginn, ende: ende, art: art == .laufband ? "in" : art == .draussen ? "out" : "")
        return .result()
    }
}

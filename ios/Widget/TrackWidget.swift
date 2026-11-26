import SwiftUI
import WidgetKit

struct Eintrag: TimelineEntry {
    let date: Date
    let stand: Stand?
}

/// Ein Eintrag genügt: Notizen hängen nicht am Tag (die Zahlen im „Überblick“ zeigen den Stand vom letzten Speichern, „heute dran“ also bis zum nächsten Öffnen). Neu gezeichnet wird, sobald die App einen neuen Stand speichert, ein Kurzbefehl eine Notiz vormerkt oder im Widget abgehakt wird.
struct Quelle: TimelineProvider {
    func placeholder(in context: Context) -> Eintrag { Eintrag(date: Date(), stand: .beispiel) }

    func getSnapshot(in context: Context, completion: @escaping (Eintrag) -> Void) {
        completion(Eintrag(date: Date(), stand: context.isPreview ? .beispiel : Ablage.lesen()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Eintrag>) -> Void) {
        // Um Mitternacht einmal neu: Dann fällt im „Überblick“ das Gym von gestern weg (siehe UeberblickWidgetAnsicht)
        let morgen = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
        completion(Timeline(entries: [Eintrag(date: Date(), stand: Ablage.lesen())], policy: .after(morgen)))
    }
}

struct NotizenWidgetAnsicht: View {
    @Environment(\.widgetFamily) private var groesse
    @Environment(\.colorScheme) private var schema
    let eintrag: Eintrag

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        Group {
            if let stand = eintrag.stand {
                // Zeilen je Größe: klein und mittel 3, groß 9
                NotizenAnsicht(notizen: stand.nz ?? [], zeilen: groesse == .systemLarge ? 9 : 3, knoepfe: groesse != .systemSmall, f: f)
            } else {
                Leer(f: f)
            }
        }
        .containerBackground(for: .widget) { f.widget }
    }
}

struct NotizenWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "notizen", provider: Quelle()) { NotizenWidgetAnsicht(eintrag: $0) }
            .configurationDisplayName("Notizen")
            .description("Deine neuesten Notizen. Der Kreis hakt ab, ohne die App zu öffnen.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct UeberblickWidgetAnsicht: View {
    @Environment(\.widgetFamily) private var groesse
    @Environment(\.colorScheme) private var schema
    let eintrag: Eintrag

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        // „heute dran“ oder „heute erledigt“ gilt nur am Tag des Stands: Ist er von gestern, fehlt die Zeile Gym, bis die App wieder offen war
        let heute = eintrag.stand?.tage.first?.d == Ablage.tag(eintrag.date)
        let zahlen = (eintrag.stand?.zahlen ?? []).filter { heute || $0.b != "training" }
        UeberblickAnsicht(zahlen: zahlen, klein: groesse == .systemSmall, f: f)
            .containerBackground(for: .widget) { f.widget }
    }
}

/// Ab 1.2: Zahlen statt Notizen. Gezeichnet wird mit demselben Stand; die Web-App schickt ihn nach jedem Speichern (Gym heute dran oder erledigt, Gewicht, Laufen, Vermögen).
struct UeberblickWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ueberblick", provider: Quelle()) { UeberblickWidgetAnsicht(eintrag: $0) }
            .configurationDisplayName("Überblick")
            .description("Gym, Gewicht, Laufen und Vermögen auf einen Blick.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct TagEintrag: TimelineEntry {
    let date: Date
    let stand: Stand?
    let termine: [WidgetTermin]?
}

/// Großes Widget „Notizen & Kalender“ (ab 1.4). Die Termine liest es selbst aus dem Kalender (Tagesblick), sonst aus der Ablage der App.
/// Neu gezeichnet wird, sobald ein Termin von heute beginnt oder endet (dann rückt die Liste weiter), spätestens nach einer Stunde (Änderungen im Kalender
/// von außen) und um Mitternacht; dazu, sobald die App einen neuen Stand oder neue Termine ablegt und wenn im Widget eine Notiz abgehakt wird.
struct TagQuelle: TimelineProvider {
    func placeholder(in context: Context) -> TagEintrag { TagEintrag(date: Date(), stand: .beispiel, termine: Tagesblick.beispiel(Date())) }

    func getSnapshot(in context: Context, completion: @escaping (TagEintrag) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : TagEintrag(date: Date(), stand: Ablage.lesen(), termine: Tagesblick.lesen()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TagEintrag>) -> Void) {
        let jetzt = Date(), stand = Ablage.lesen(), termine = Tagesblick.lesen(jetzt)
        let morgen = Calendar.current.startOfDay(for: jetzt.addingTimeInterval(86400))
        let neu = min(morgen, jetzt.addingTimeInterval(3600))
        var zeiten = Set<Double>()
        for t in termine ?? [] where !t.g {
            for z in [t.s, t.e] where z > jetzt.timeIntervalSince1970 && z < neu.timeIntervalSince1970 { zeiten.insert(z) }
        }
        let spaeter = zeiten.sorted().map { TagEintrag(date: Date(timeIntervalSince1970: $0), stand: stand, termine: termine) }
        completion(Timeline(entries: [TagEintrag(date: jetzt, stand: stand, termine: termine)] + spaeter, policy: .after(neu)))
    }
}

struct TagWidgetAnsicht: View {
    @Environment(\.colorScheme) private var schema
    let eintrag: TagEintrag

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        TagAnsicht(notizen: eintrag.stand?.nz ?? [], termine: eintrag.termine, jetzt: eintrag.date, f: f)
            .containerBackground(for: .widget) { f.widget }
    }
}

struct TagWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "tag", provider: TagQuelle()) { TagWidgetAnsicht(eintrag: $0) }
            .configurationDisplayName("Notizen & Kalender")
            .description("Oben deine neuesten Notizen, darunter deine Termine von heute bis übermorgen.")
            .supportedFamilies([.systemLarge])
    }
}

@main
struct TrackWidgets: WidgetBundle {
    var body: some Widget {
        NotizenWidget()
        UeberblickWidget()
        TagWidget()
    }
}

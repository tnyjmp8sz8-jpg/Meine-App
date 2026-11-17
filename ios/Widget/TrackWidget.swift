import SwiftUI
import WidgetKit

struct Eintrag: TimelineEntry {
    let date: Date
    let stand: Stand?
}

/// Ein Eintrag für jetzt und je einer für die nächsten sieben Mitternächte. Neu gezeichnet wird außerdem, sobald die App einen neuen Stand speichert.
struct Quelle: TimelineProvider {
    func placeholder(in context: Context) -> Eintrag { Eintrag(date: Date(), stand: .beispiel) }

    func getSnapshot(in context: Context, completion: @escaping (Eintrag) -> Void) {
        completion(Eintrag(date: Date(), stand: context.isPreview ? .beispiel : Ablage.lesen()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Eintrag>) -> Void) {
        let stand = Ablage.lesen(), jetzt = Date(), kalender = Calendar.current
        var liste = [Eintrag(date: jetzt, stand: stand)]
        for i in 1...7 {
            if let tag = kalender.date(byAdding: .day, value: i, to: kalender.startOfDay(for: jetzt)) { liste.append(Eintrag(date: tag, stand: stand)) }
        }
        completion(Timeline(entries: liste, policy: .atEnd))
    }
}

struct HeuteAnsicht: View {
    @Environment(\.widgetFamily) private var groesse
    @Environment(\.colorScheme) private var schema
    let eintrag: Eintrag

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        Group {
            if let stand = eintrag.stand, let tag = stand.tag(eintrag.date) {
                if groesse == .systemMedium { Mittel(tag: tag, notizen: (stand.nz ?? []).map { $0.x }, f: f) } else { Klein(tag: tag, f: f) }
            } else {
                Leer(f: f)
            }
        }
        .containerBackground(for: .widget) { f.grund }
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
        .containerBackground(for: .widget) { f.grund }
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

struct HeuteWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "heute", provider: Quelle()) { HeuteAnsicht(eintrag: $0) }
            .configurationDisplayName("Heute")
            .description("Routinen, Aufgaben und Notizen von heute.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct TrackWidgets: WidgetBundle {
    var body: some Widget {
        NotizenWidget()
        HeuteWidget()
    }
}

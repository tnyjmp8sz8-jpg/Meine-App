import SwiftUI
import WidgetKit

struct Eintrag: TimelineEntry {
    let date: Date
    let stand: Stand?
}

/// Ein Eintrag genügt: Notizen hängen nicht am Tag. Neu gezeichnet wird, sobald die App einen neuen Stand speichert, ein Kurzbefehl eine Notiz vormerkt oder im Widget abgehakt wird.
struct Quelle: TimelineProvider {
    func placeholder(in context: Context) -> Eintrag { Eintrag(date: Date(), stand: .beispiel) }

    func getSnapshot(in context: Context, completion: @escaping (Eintrag) -> Void) {
        completion(Eintrag(date: Date(), stand: context.isPreview ? .beispiel : Ablage.lesen()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Eintrag>) -> Void) {
        completion(Timeline(entries: [Eintrag(date: Date(), stand: Ablage.lesen())], policy: .never))
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

@main
struct TrackWidgets: WidgetBundle {
    var body: some Widget {
        NotizenWidget()
    }
}

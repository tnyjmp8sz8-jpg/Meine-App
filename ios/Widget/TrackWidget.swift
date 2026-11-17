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

extension View {
    /// Ab iOS 17 setzt das System Hintergrund und Rand des Widgets, davor die Ansicht selbst
    @ViewBuilder func widgetGrund(_ farbe: Color) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(for: .widget) { farbe }
        } else {
            padding(16).frame(maxWidth: .infinity, maxHeight: .infinity).background(farbe)
        }
    }
}

struct WidgetAnsicht: View {
    @Environment(\.widgetFamily) private var groesse
    @Environment(\.colorScheme) private var schema
    let eintrag: Eintrag

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        Group {
            if let stand = eintrag.stand, let tag = stand.tag(eintrag.date) {
                if groesse == .systemMedium { Mittel(tag: tag, notizen: stand.notizen, f: f) } else { Klein(tag: tag, f: f) }
            } else {
                Leer(f: f)
            }
        }
        .widgetGrund(f.grund)
    }
}

@main
struct HeuteWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "heute", provider: Quelle()) { WidgetAnsicht(eintrag: $0) }
            .configurationDisplayName("Heute")
            .description("Routinen, Aufgaben und Notizen von heute.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

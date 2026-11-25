import AppIntents
import SwiftUI

// Inhalt des Widgets „Notizen“ (das Widget „Heute“ mit Routinen und Aufgaben gibt es seit 0.7 nicht mehr: Beides ist aus der App ausgebaut). Liegt in beiden Zielen: im Widget selbst und in der App, die ihn mit „-widgetbild“ für das Bild aus dem Simulator zeigt.

extension Color {
    init(_ hex: UInt32) { self.init(red: Double((hex >> 16) & 255) / 255, green: Double((hex >> 8) & 255) / 255, blue: Double(hex & 255) / 255) }
}

/// Farben wie in der Web-App (dunkel und hell). Dunkel seit 1.0 schwarz mit neutralem Grau, wie die Web-App seit v87.
struct Farben {
    let seite, grund, schrift, blass, blau, gruen, orange, spur: Color
    init(dunkel: Bool) {
        seite = Color(dunkel ? 0x000000 : 0xF2F2F7)
        grund = Color(dunkel ? 0x1C1C1E : 0xFFFFFF)
        schrift = Color(dunkel ? 0xF5F5F7 : 0x111114)
        blass = Color(dunkel ? 0x98989F : 0x6C6C72)
        blau = Color(dunkel ? 0x0A84FF : 0x007AFF)
        gruen = Color(dunkel ? 0x30D158 : 0x248A3D)
        orange = Color(dunkel ? 0xFF9F0A : 0xF08C00)
        spur = Color(dunkel ? 0x2C2C2E : 0xE9E9EE)
    }
}

/// Solange die App noch keinen Stand geschickt hat
struct Leer: View {
    let f: Farben

    var body: some View {
        Text("Öffne Track., um deine Notizen zu laden.").font(.system(size: 13)).foregroundColor(f.blass)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

/// Abhaken einer Notiz direkt im Widget (ohne die App zu öffnen). Die Notiz verschwindet sofort aus dem Widget;
/// in der App wird sie beim nächsten Öffnen gelöscht, dort mit „Rückgängig“.
struct NotizAbhaken: AppIntent {
    static var title: LocalizedStringResource = "Notiz abhaken"
    static var isDiscoverable: Bool = false

    @Parameter(title: "Kennung")
    var kennung: String

    init() {}
    init(kennung: String) { self.kennung = kennung }

    func perform() async throws -> some IntentResult {
        Ablage.notizWeg(kennung)
        return .result()
    }
}

/// Widget „Notizen“: die neuesten Notizen, jede mit Kreis zum Abhaken. Die Knöpfe „Notiz“ und „Ausgabe“ (mittel, groß) öffnen die Schnelleingabe der App (siehe Schnell.swift).
struct NotizenAnsicht: View {
    let notizen: [Stand.Notiz]
    let zeilen: Int
    let knoepfe: Bool
    let f: Farben

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                Text("Notizen").font(.system(size: 15, weight: .semibold)).foregroundColor(f.schrift)
                Spacer(minLength: 0)
                if knoepfe {
                    knopf("Notiz", "trackpunkt://schnell/notiz", f.blau)
                    knopf("Ausgabe", "trackpunkt://schnell/ausgabe", f.orange)
                }
            }
            .frame(height: 28)
            if notizen.isEmpty {
                Text("Keine Notizen").font(.system(size: 13)).foregroundColor(f.blass).frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ForEach(Array(notizen.prefix(zeilen)), id: \.id) { notiz in
                    HStack(spacing: 5) {
                        Button(intent: NotizAbhaken(kennung: notiz.id)) {
                            Image(systemName: "circle").font(.system(size: 17, weight: .light)).foregroundColor(f.blass).frame(width: 24, height: 30)
                        }
                        .buttonStyle(.plain)
                        Text(notiz.x).font(.system(size: 13)).foregroundColor(f.schrift).lineLimit(1)
                    }
                    .frame(height: 30, alignment: .leading)
                }
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func knopf(_ titel: String, _ ziel: String, _ farbe: Color) -> some View {
        Link(destination: URL(string: ziel)!) {
            HStack(spacing: 3) {
                Image(systemName: "plus").font(.system(size: 10, weight: .bold)).foregroundColor(farbe)
                Text(titel).font(.system(size: 12, weight: .medium)).foregroundColor(f.schrift)
            }
            .padding(.horizontal, 9).frame(height: 26).background(f.spur).clipShape(Capsule())
        }
    }
}

import AppIntents
import SwiftUI

// Inhalt des Widgets. Liegt in beiden Zielen: im Widget selbst und in der App, die ihn mit „-widgetbild“ für das Bild aus dem Simulator zeigt.

extension Color {
    init(_ hex: UInt32) { self.init(red: Double((hex >> 16) & 255) / 255, green: Double((hex >> 8) & 255) / 255, blue: Double(hex & 255) / 255) }
}

/// Farben wie in der Web-App (dunkel und hell)
struct Farben {
    let grund, schrift, blass, blau, gruen, orange, spur: Color
    init(dunkel: Bool) {
        grund = Color(dunkel ? 0x1A1C22 : 0xFFFFFF)
        schrift = Color(dunkel ? 0xF5F6F8 : 0x111114)
        blass = Color(dunkel ? 0x9296A3 : 0x6C6C72)
        blau = Color(dunkel ? 0x0A84FF : 0x007AFF)
        gruen = Color(dunkel ? 0x30D158 : 0x248A3D)
        orange = Color(dunkel ? 0xFF9F0A : 0xF08C00)
        spur = Color(dunkel ? 0x272A32 : 0xE9E9EE)
    }
}

/// Ring: Routinen erledigt von geplant. Grün mit Haken, sobald alle erledigt sind.
struct Fortschritt: View {
    let tag: Stand.Tag
    let f: Farben

    var body: some View {
        let fertig = tag.rn > 0 && tag.rd >= tag.rn
        ZStack {
            Circle().stroke(f.spur, lineWidth: 7)
            Circle().trim(from: 0, to: tag.rn > 0 ? CGFloat(min(tag.rd, tag.rn)) / CGFloat(tag.rn) : 0)
                .stroke(fertig ? f.gruen : f.blau, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                .rotationEffect(.degrees(-90))
            if fertig {
                Image(systemName: "checkmark").font(.system(size: 21, weight: .bold)).foregroundColor(f.gruen)
            } else {
                Text(tag.rn > 0 ? "\(tag.rd)/\(tag.rn)" : "–").font(.system(size: 17, weight: .bold, design: .rounded)).foregroundColor(f.schrift)
            }
        }
        .frame(width: 58, height: 58).padding(3.5)
    }
}

/// Kleines Widget: Ring, darunter Routinen und offene Aufgaben
struct Klein: View {
    let tag: Stand.Tag
    let f: Farben

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Fortschritt(tag: tag, f: f)
            Spacer(minLength: 0)
            Text(tag.rn == 0 ? "Keine Routinen" : tag.rd >= tag.rn ? "Routinen erledigt" : "Routinen")
                .font(.system(size: 15, weight: .semibold)).foregroundColor(f.schrift).lineLimit(1).minimumScaleFactor(0.8)
            Text(tag.an == 0 ? "Keine Aufgabe offen" : tag.an == 1 ? "1 Aufgabe offen" : "\(tag.an) Aufgaben offen")
                .font(.system(size: 12)).foregroundColor(f.blass).lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

/// Mittleres Widget: links wie das kleine, rechts bis zu vier Zeilen (erst Aufgaben, dann die neuesten Notizen)
struct Mittel: View {
    let tag: Stand.Tag
    let notizen: [String]
    let f: Farben

    var body: some View {
        let aufgaben = Array(tag.auf.prefix(4)), rest = Array(notizen.prefix(4 - aufgaben.count))
        HStack(alignment: .top, spacing: 14) {
            Klein(tag: tag, f: f).frame(width: 118)
            VStack(alignment: .leading, spacing: 0) {
                if aufgaben.isEmpty && rest.isEmpty {
                    Text("Nichts offen").font(.system(size: 13)).foregroundColor(f.blass).frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ForEach(aufgaben.indices, id: \.self) { zeile("circle", aufgaben[$0]) }
                    ForEach(rest.indices, id: \.self) { zeile("note.text", rest[$0]) }
                    Spacer(minLength: 0)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    private func zeile(_ bild: String, _ text: String) -> some View {
        HStack(spacing: 7) {
            Image(systemName: bild).font(.system(size: 12)).foregroundColor(f.blass).frame(width: 16)
            Text(text).font(.system(size: 13)).foregroundColor(f.schrift).lineLimit(1)
        }
        .frame(height: 30, alignment: .leading)
    }
}

/// Solange die App noch keinen Stand geschickt hat (oder er älter als eine Woche ist)
struct Leer: View {
    let f: Farben

    var body: some View {
        Text("Öffne Track., um den Tag zu laden.").font(.system(size: 13)).foregroundColor(f.blass)
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

/// Widget „Notizen“: die neuesten Notizen, jede mit Kreis zum Abhaken. Mit Knöpfen (mittel, groß) öffnen „Notiz“ und „Ausgabe“ die App gleich im richtigen Blatt.
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
                    knopf("Notiz", "trackpunkt://neu/notiz", f.blau)
                    knopf("Ausgabe", "trackpunkt://neu/ausgabe", f.orange)
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

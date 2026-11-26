import AppIntents
import SwiftUI

// Inhalt der Widgets „Notizen“ und seit 1.2 „Überblick“ (das Widget „Heute“ mit Routinen und Aufgaben gibt es seit 0.7 nicht mehr: Beides ist aus der App ausgebaut). Liegt in beiden Zielen: im Widget selbst und in der App, die ihn mit „-widgetbild“ für das Bild aus dem Simulator zeigt.

extension Color {
    init(_ hex: UInt32) { self.init(red: Double((hex >> 16) & 255) / 255, green: Double((hex >> 8) & 255) / 255, blue: Double(hex & 255) / 255) }
}

/// Farben wie in der Web-App (dunkel und hell). Dunkel seit 1.0 schwarz mit neutralem Grau, wie die Web-App seit v87.
struct Farben {
    let seite, grund, widget, schrift, blass, blau, gruen, orange, lila, spur: Color
    init(dunkel: Bool) {
        seite = Color(dunkel ? 0x000000 : 0xF2F2F7)
        grund = Color(dunkel ? 0x1C1C1E : 0xFFFFFF)
        // Grund des Widgets (1.1, sein Wunsch nach seinem Bildschirmfoto vom 25.11.: „wie das darunter von Apple“, das Kalender-Widget): schwarz wie Apples eigene Widgets,
        // iOS legt sein Glas mit der hellen Kante oben selbst darüber. Bis 1.0 war es #1C1C1E und wirkte darunter deutlich grauer als die Widgets von Apple.
        widget = Color(dunkel ? 0x000000 : 0xFFFFFF)
        schrift = Color(dunkel ? 0xF5F5F7 : 0x111114)
        blass = Color(dunkel ? 0x98989F : 0x6C6C72)
        blau = Color(dunkel ? 0x0A84FF : 0x007AFF)
        gruen = Color(dunkel ? 0x30D158 : 0x248A3D)
        orange = Color(dunkel ? 0xFF9F0A : 0xF08C00)
        lila = Color(dunkel ? 0xBF5AF2 : 0xAF52DE)
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

/// Kapsel zum schnellen Eintragen im Widget: Plus in der Farbe des Bereichs, dahinter das Wort. Notiz und Ausgabe öffnen die Schnelleingabe (Schnell.swift),
/// Termin (ab 1.4) die App mit dem Blatt „Termin“. Seit v131 gibt es auf Heute keine Reihe mit Schnell-Knöpfen mehr (sein Wunsch): Hier ist ihr Platz.
func widgetKnopf(_ titel: String, _ ziel: String, _ farbe: Color, _ f: Farben) -> some View {
    Link(destination: URL(string: ziel)!) {
        HStack(spacing: 3) {
            Image(systemName: "plus").font(.system(size: 10, weight: .bold)).foregroundColor(farbe)
            Text(titel).font(.system(size: 12, weight: .medium)).foregroundColor(f.schrift).lineLimit(1)
        }
        .padding(.horizontal, 9).frame(height: 26).background(f.spur).clipShape(Capsule())
    }
    .fixedSize()
}

/// Widget „Notizen“: die neuesten Notizen, jede mit Kreis zum Abhaken. Die Knöpfe „Notiz“, „Ausgabe“ und seit 1.4 „Termin“ (mittel, groß) siehe widgetKnopf.
struct NotizenAnsicht: View {
    let notizen: [Stand.Notiz]
    let zeilen: Int
    let knoepfe: Bool
    let f: Farben

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                // Mit drei Knöpfen wird es eng (mittel 306 Punkte breit): Dann kürzt der Titel, nie ein Knopf
                Text("Notizen").font(.system(size: 15, weight: .semibold)).foregroundColor(f.schrift).lineLimit(1).layoutPriority(-1)
                Spacer(minLength: 0)
                if knoepfe {
                    widgetKnopf("Notiz", "trackpunkt://schnell/notiz", f.blau, f)
                    widgetKnopf("Ausgabe", "trackpunkt://schnell/ausgabe", f.orange, f)
                    widgetKnopf("Termin", "trackpunkt://neu/termin", f.blau, f)
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
}

/// Widget „Überblick“ (ab 1.2): bis zu vier Zahlen aus der App (Gym, Gewicht, Laufen, Vermögen oder Budget), je mit der Kennfarbe des Bereichs.
/// Klein zwei, mittel vier im Raster. Ein Tipp öffnet die App.
struct UeberblickAnsicht: View {
    let zahlen: [Stand.Zahl]
    let klein: Bool
    let f: Farben

    var body: some View {
        let liste = Array(zahlen.prefix(klein ? 2 : 4))
        if liste.isEmpty {
            Text("Öffne Track., um deine Zahlen zu laden.").font(.system(size: 13)).foregroundColor(f.blass)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        } else if klein {
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(liste.enumerated()), id: \.offset) { feld($0.element) }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        } else {
            let spalten = [GridItem(.flexible(), spacing: 14, alignment: .topLeading), GridItem(.flexible(), spacing: 14, alignment: .topLeading)]
            LazyVGrid(columns: spalten, alignment: .leading, spacing: 12) {
                ForEach(Array(liste.enumerated()), id: \.offset) { feld($0.element) }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    private func farbe(_ bereich: String) -> Color {
        switch bereich {
        case "gewicht": return f.lila
        case "haushalt": return f.orange
        case "training", "cardio": return f.gruen
        default: return f.blau
        }
    }

    private func feld(_ z: Stand.Zahl) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            HStack(spacing: 5) {
                Circle().fill(farbe(z.b)).frame(width: 6, height: 6)
                Text(z.t).font(.system(size: 11, weight: .medium)).foregroundColor(f.blass).lineLimit(1)
            }
            Text(z.w).font(.system(size: 17, weight: .semibold, design: .rounded)).foregroundColor(f.schrift).lineLimit(1).minimumScaleFactor(0.7)
            Text(z.s).font(.system(size: 11)).foregroundColor(f.blass).lineLimit(1).minimumScaleFactor(0.8)
        }
    }
}

/// Farbe aus „#RRGGBB“ (Farbe eines Kalenders); sonst die angegebene
func farbeAus(_ text: String?, _ sonst: Color) -> Color {
    guard let t = text, t.count == 7, t.hasPrefix("#"), let wert = UInt32(t.dropFirst(), radix: 16) else { return sonst }
    return Color(wert)
}

/// Großes Widget „Notizen & Kalender“ (ab 1.4, sein Wunsch vom 26.11.: „ein großes Widget mit Hälfte letzte Notizen … und Kalender drunter mit meinen Sachen
/// von heute und morgen/übermorgen, so wie bei Apple, aber vereint in einem“). Oben die neuesten Notizen mit Kreis zum Abhaken wie im Widget „Notizen“,
/// darunter die Termine von heute bis übermorgen wie in Apples Kalender-Widget „Liste“: je Tag eine kleine Überschrift, je Termin ein Strich in der Farbe
/// seines Kalenders, Titel und Uhrzeit. Ein Termin von heute verschwindet, sobald er vorbei ist. Was nicht mehr passt, zählt „+ n weitere“.
/// Knöpfe: „+ Notiz“ und „+ Ausgabe“ über den Notizen (Schnelleingabe), „+ Termin“ über den Terminen (Blatt in der App); ein Tipp auf die Termine öffnet die Übersicht in der App.
struct TagAnsicht: View {
    let notizen: [Stand.Notiz]
    let termine: [WidgetTermin]?
    let jetzt: Date
    let f: Farben

    private enum Zeile: Hashable { case tag(String, Bool), termin(WidgetTermin, String), mehr(Int), leer(String) }

    /// Höhen in Punkten. Platz für die Termine: groß auf dem iPhone 12 Pro 354 Punkte hoch, abzüglich Rand (2 × 16), Notizen (26 + 4 × 27), Linie (17) und Kopf (26).
    private let platz: CGFloat = 145, hTag: CGFloat = 19, hTermin: CGFloat = 22, hMehr: CGFloat = 17

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 0) {
                kopf("Notizen", [("Notiz", "trackpunkt://schnell/notiz", f.blau), ("Ausgabe", "trackpunkt://schnell/ausgabe", f.orange)])
                if notizen.isEmpty {
                    Text("Keine Notizen").font(.system(size: 13)).foregroundColor(f.blass).frame(height: 27)
                } else {
                    ForEach(Array(notizen.prefix(4)), id: \.id) { notiz in
                        HStack(spacing: 5) {
                            Button(intent: NotizAbhaken(kennung: notiz.id)) {
                                Image(systemName: "circle").font(.system(size: 17, weight: .light)).foregroundColor(f.blass).frame(width: 24, height: 27)
                            }
                            .buttonStyle(.plain)
                            // Ab 1.5: Tipp auf den Text öffnet den Planer bei den Notizen
                            Link(destination: URL(string: "trackpunkt://neu/notizen")!) {
                                Text(notiz.x).font(.system(size: 13)).foregroundColor(f.schrift).lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                        .frame(height: 27, alignment: .leading)
                    }
                }
            }
            .frame(height: 134, alignment: .topLeading)
            Rectangle().fill(f.spur).frame(height: 0.5).padding(.vertical, 8)
            kopf("Kalender", [("Termin", "trackpunkt://neu/termin", f.blau)])
            Link(destination: URL(string: "trackpunkt://neu/kalender")!) {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(zeilen().enumerated()), id: \.offset) { zeile($0.element) }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func kopf(_ titel: String, _ knoepfe: [(String, String, Color)]) -> some View {
        HStack(spacing: 6) {
            Text(titel).font(.system(size: 15, weight: .semibold)).foregroundColor(f.schrift).lineLimit(1).layoutPriority(-1)
            Spacer(minLength: 0)
            ForEach(Array(knoepfe.enumerated()), id: \.offset) { widgetKnopf($0.element.0, $0.element.1, $0.element.2, f) }
        }
        .frame(height: 26)
    }

    @ViewBuilder private func zeile(_ z: Zeile) -> some View {
        switch z {
        case .tag(let name, let heute):
            Text(name).font(.system(size: 11.5, weight: .semibold)).foregroundColor(heute ? f.blau : f.blass)
                .frame(height: hTag, alignment: .bottomLeading).padding(.bottom, 2)
        case .termin(let t, let zeit):
            HStack(spacing: 7) {
                RoundedRectangle(cornerRadius: 1.5, style: .continuous).fill(farbeAus(t.f, f.blau)).frame(width: 3, height: 15)
                Text(t.t.isEmpty ? "Ohne Titel" : t.t).font(.system(size: 13, weight: .medium)).foregroundColor(f.schrift).lineLimit(1)
                Spacer(minLength: 4)
                Text(zeit).font(.system(size: 12)).monospacedDigit().foregroundColor(f.blass).lineLimit(1)
            }
            .frame(height: hTermin)
        case .mehr(let n):
            Text("+ \(n) weitere").font(.system(size: 11.5)).foregroundColor(f.blass).frame(height: hMehr, alignment: .leading)
        case .leer(let text):
            Text(text).font(.system(size: 13)).foregroundColor(f.blass).frame(height: 27, alignment: .leading)
        }
    }

    private static let uhr: DateFormatter = { let d = DateFormatter(); d.locale = Locale(identifier: "de_DE"); d.dateFormat = "HH:mm"; return d }()
    private static let wochentag: DateFormatter = { let d = DateFormatter(); d.locale = Locale(identifier: "de_DE"); d.dateFormat = "EEEE"; return d }()

    /// Was in die untere Hälfte passt, in dieser Reihenfolge: je Tag mit Terminen die Überschrift, dann seine Termine (ganztägige zuerst)
    private func zeilen() -> [Zeile] {
        guard let alle = termine else { return [.leer("Öffne Track. und erlaube den Kalender.")] }
        let kalender = Calendar.current, start = kalender.startOfDay(for: jetzt), namen = ["Heute", "Morgen", "Übermorgen"]
        var bloecke: [[Zeile]] = []
        for i in 0..<3 {
            let von = kalender.date(byAdding: .day, value: i, to: start) ?? start, bis = kalender.date(byAdding: .day, value: i + 1, to: start) ?? start
            let a = von.timeIntervalSince1970, b = bis.timeIntervalSince1970, n = jetzt.timeIntervalSince1970
            let heute = alle.filter { $0.s < b && $0.e > a && (i > 0 || $0.g || $0.e > n) }
                .sorted { ($0.g ? 0 : 1, $0.s) < ($1.g ? 0 : 1, $1.s) }
            guard !heute.isEmpty else { continue }
            var block: [Zeile] = [.tag(namen[i], i == 0)]
            for t in heute {
                let zeit: String
                if t.g || (t.s <= a && t.e >= b) { zeit = "ganztägig" }
                else if t.s < a { zeit = "bis " + TagAnsicht.uhr.string(from: Date(timeIntervalSince1970: t.e)) }
                else if i == 0 && t.s <= n { zeit = "jetzt" }
                else { zeit = TagAnsicht.uhr.string(from: Date(timeIntervalSince1970: t.s)) }
                block.append(.termin(t, zeit))
            }
            bloecke.append(block)
        }
        if bloecke.isEmpty {
            let letzter = kalender.date(byAdding: .day, value: 2, to: start) ?? start
            return [.leer("Keine Termine bis " + TagAnsicht.wochentag.string(from: letzter))]
        }
        // Zeilen nehmen, solange sie passen; bleibt etwas übrig, zählt die letzte Zeile den Rest. Eine Tagesüberschrift steht nie allein am Ende.
        let flach = bloecke.flatMap { $0 }
        let hoehe = { (z: Zeile) -> CGFloat in
            switch z { case .tag: return self.hTag; case .termin: return self.hTermin; default: return self.hMehr }
        }
        var genommen: [Zeile] = [], summe: CGFloat = 0
        for (i, z) in flach.enumerated() {
            let rest = flach.count - i - 1
            if summe + hoehe(z) + (rest > 0 ? hMehr : 0) > platz && rest > 0 { break }
            if summe + hoehe(z) > platz { break }
            genommen.append(z); summe += hoehe(z)
        }
        if case .tag = genommen.last { genommen.removeLast() }
        let gezeigt = genommen.filter { if case .termin = $0 { return true } else { return false } }.count
        let gesamt = flach.filter { if case .termin = $0 { return true } else { return false } }.count
        if gezeigt < gesamt { genommen.append(.mehr(gesamt - gezeigt)) }
        return genommen
    }
}

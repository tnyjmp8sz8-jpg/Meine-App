import SwiftUI
import UIKit
import WidgetKit

/// Schnelleingabe: Die Knöpfe „Notiz“ und „Ausgabe“ im Widget öffnen die App nur mit einem Eingabefeld (trackpunkt://schnell/notiz).
/// Nach dem Bestätigen geht die App von selbst zurück auf den Home-Bildschirm. Näher kommt man an ein Popup nicht heran:
/// Ein Widget darf selbst keine Tastatur zeigen.
/// Bei „Ausgabe“ lässt sich oben auf Einnahme umstellen und darunter das Konto wählen (seit 0.5), damit die Buchung gleich im Vermögen mitrechnet.
enum Schnell: String {
    case notiz, ausgabe

    /// Zurück auf den Home-Bildschirm, wie ein Druck auf die Home-Taste
    static func nachHause() {
        let wahl = NSSelectorFromString("suspend")
        if UIApplication.shared.responds(to: wahl) { UIApplication.shared.perform(wahl) }
    }
}

/// Ob gerade die Schnelleingabe über der App liegt
final class Lage: ObservableObject {
    static let shared = Lage()
    /// Für den Selbsttest lässt sich die Schnelleingabe auch beim Start zeigen („-schnell notiz“): Im Simulator fragt das Öffnen über die Adresse erst nach.
    @Published var schnell: Schnell? = UserDefaults.standard.string(forKey: "schnell").flatMap { Schnell(rawValue: $0) }
}

struct Schnelleingabe: View {
    let art: Schnell
    @Environment(\.colorScheme) private var schema
    @State private var text = ""
    @State private var wofuer = ""
    @State private var einnahme = false
    @State private var konten: [Stand.Konto] = []
    /// Gewähltes Konto: nil = noch keines · "" = „Kein Konto“ · sonst die Kennung
    @State private var konto: String? = nil

    /// Betrag in Cent (deutsches Komma oder Punkt)
    private var cent: Double { ((Double(text.replacingOccurrences(of: ",", with: ".")) ?? 0) * 100).rounded() }
    /// Bei Ausgabe und Einnahme: Betrag über 0 und, wenn es Konten gibt, eine Wahl (auch „Kein Konto“ ist eine)
    private var gueltig: Bool {
        if art == .notiz { return !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        return cent > 0 && cent <= 1e9 && (konten.isEmpty || konto != nil)
    }

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        let frage = einnahme ? "Woher? (kann leer bleiben)" : "Wofür? (kann leer bleiben)"
        ZStack(alignment: .top) {
            // Tipp daneben bricht ab, aber nur solange nichts getippt ist: Ein Fehltipp soll keinen Text kosten
            f.seite.ignoresSafeArea().onTapGesture { if text.isEmpty && wofuer.isEmpty { schliessen() } }
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 10) {
                    if art == .notiz {
                        Text("Notiz").font(.system(size: 13, weight: .semibold)).foregroundColor(f.blass)
                    } else {
                        HStack(spacing: 8) {
                            pille("Ausgabe", !einnahme, f) { einnahme = false }
                            pille("Einnahme", einnahme, f) { einnahme = true }
                        }
                    }
                    HStack(spacing: 10) {
                        Eingabefeld(text: $text, platzhalter: art == .notiz ? "Was möchtest du notieren?" : "0,00", zahl: art == .ausgabe, farben: f, fertig: sichern)
                            .frame(height: 34)
                        if art == .ausgabe { Text("€").font(.system(size: 24, weight: .semibold, design: .rounded)).foregroundColor(f.blass) }
                        Button(action: sichern) {
                            Image(systemName: "checkmark").font(.system(size: 15, weight: .bold)).foregroundColor(gueltig ? .white : f.blass)
                                .frame(width: 36, height: 36).background(gueltig ? f.blau : f.spur).clipShape(Circle())
                        }
                        .disabled(!gueltig)
                    }
                    if art == .ausgabe {
                        Rectangle().fill(f.spur).frame(height: 1)
                        TextField(frage, text: $wofuer).font(.system(size: 15)).foregroundColor(f.schrift).tint(f.blau)
                            .submitLabel(.done).onSubmit(sichern)
                        if !konten.isEmpty {
                            Rectangle().fill(f.spur).frame(height: 1)
                            kontenReihe(f)
                        }
                    }
                }
                .padding(16).background(f.grund).clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                Button("Abbrechen", action: schliessen).font(.system(size: 15)).foregroundColor(f.blass)
            }
            .padding(.horizontal, 16).padding(.top, 56)
        }
        .onAppear {
            kontenLaden()
            // Nur für den Selbsttest im Bau: trägt von selbst etwas ein, damit geprüft ist, dass Speichern und Schließen gehen.
            // Bei „Ausgabe“ stellt die Probe dazu auf Einnahme und wählt das zweite Konto.
            guard CommandLine.arguments.contains("-schnellprobe") else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                if art == .notiz {
                    text = "Schnell notiert"
                } else {
                    text = "4,20"
                    einnahme = true
                    if konten.count > 1 { konto = konten[1].id }
                }
                sichern()
            }
        }
    }

    /// Pille zum Wählen: gewählt blau mit weißer Schrift, sonst ruhig. Ein Tipp darauf lässt die Tastatur offen.
    private func pille(_ titel: String, _ an: Bool, _ f: Farben, _ tipp: @escaping () -> Void) -> some View {
        Button(action: tipp) {
            Text(titel).font(.system(size: 13, weight: .medium)).foregroundColor(an ? .white : f.blass).lineLimit(1)
                .padding(.horizontal, 12).frame(height: 32).background(an ? f.blau : f.spur).clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    /// Konten als Pillen in einer Reihe, die sich seitlich schieben lässt (so ist auch auf einem schmalen Gerät nichts abgeschnitten); am Ende „Kein Konto“
    private func kontenReihe(_ f: Farben) -> some View {
        ScrollViewReader { leser in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(konten, id: \.id) { eins in
                        pille(Schnelleingabe.kurz(eins.n), konto == eins.id, f) { konto = eins.id }.id(eins.id)
                    }
                    pille("Kein Konto", konto == "", f) { konto = "" }
                }
            }
            .scrollDismissesKeyboard(.never)
            .onAppear {
                // Das vorbelegte Konto soll zu sehen sein, auch wenn es weiter hinten in der Reihe steht
                if let wahl = konto, !wahl.isEmpty { DispatchQueue.main.async { leser.scrollTo(wahl, anchor: .center) } }
            }
        }
    }

    /// Lange Kontonamen kürzen, damit eine Pille nicht die ganze Reihe füllt
    private static func kurz(_ name: String) -> String { name.count > 22 ? String(name.prefix(21)) + "…" : name }

    /// Konten aus dem letzten Stand der App. Vorbelegt ist das zuletzt hier gewählte Konto, sonst das, das die App im Blatt vorbelegen würde
    /// (zuletzt benutzt oder das einzige) – jeweils nur, wenn es noch in der Liste steht. „Kein Konto“ wird nie von selbst gewählt.
    private func kontenLaden() {
        guard art == .ausgabe else { return }
        let stand = Ablage.lesen()
        var liste = stand?.konten ?? []
        var zuletzt = UserDefaults.standard.string(forKey: "schnellKonto") ?? ""
        var vor = stand?.konto ?? ""
        // Für das Bild und die Probe im Bau: drei Beispielkonten statt des Stands
        if CommandLine.arguments.contains("-schnellkonten") {
            liste = [Stand.Konto(id: "b1", n: "Girokonto"), Stand.Konto(id: "b2", n: "Sparkonto"), Stand.Konto(id: "b3", n: "Depot")]
            zuletzt = ""
            vor = "b1"
        }
        konten = liste
        if liste.contains(where: { $0.id == zuletzt }) {
            konto = zuletzt
        } else if liste.contains(where: { $0.id == vor }) {
            konto = vor
        } else {
            konto = nil
        }
    }

    private func sichern() {
        guard gueltig else { return }
        if art == .notiz {
            Ablage.notizDazu(text.trimmingCharacters(in: .whitespacesAndNewlines))
        } else {
            var auftrag: [String: Any] = ["art": "ausgabe", "a": cent, "n": wofuer.trimmingCharacters(in: .whitespacesAndNewlines), "kat": "", "k": einnahme ? "in" : "out"]
            // acc nur, wenn es Konten gibt: die Kennung, leer heißt ausdrücklich „Kein Konto“. Ohne das Feld belegt die App wie bisher selbst vor.
            if !konten.isEmpty, let wahl = konto {
                auftrag["acc"] = wahl
                if !wahl.isEmpty { UserDefaults.standard.set(wahl, forKey: "schnellKonto") }
            }
            Ablage.vormerken(auftrag)
            // Nur in der Probe: den Auftrag zusätzlich ablegen, damit der Bau ihn prüfen kann
            if CommandLine.arguments.contains("-schnellprobe"), let daten = try? JSONSerialization.data(withJSONObject: auftrag) {
                try? daten.write(to: FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("schnellprobe.json"))
            }
        }
        WidgetCenter.shared.reloadAllTimelines()
        NotificationCenter.default.post(name: Halter.eingangDa, object: nil)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        schliessen()
    }

    /// Zurück auf den Home-Bildschirm. Die Eingabe bleibt dabei stehen, bis die App im Hintergrund ist (siehe TrackApp): So blitzt die App dahinter nicht auf.
    /// Geht das Zurückgehen einmal nicht, verschwindet nur die Eingabe, und die App bleibt offen.
    private func schliessen() {
        Schnell.nachHause()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
            if UIApplication.shared.applicationState == .active { Lage.shared.schnell = nil }
        }
    }
}

/// Textfeld, das die Tastatur sofort öffnet, sobald es zu sehen ist (mit SwiftUI allein klappt das beim Start der App nicht zuverlässig)
struct Eingabefeld: UIViewRepresentable {
    @Binding var text: String
    let platzhalter: String
    let zahl: Bool
    let farben: Farben
    let fertig: () -> Void

    func makeCoordinator() -> Helfer { Helfer(self) }

    func makeUIView(context: Context) -> Feld {
        let feld = Feld()
        feld.font = zahl ? UIFont.systemFont(ofSize: 28, weight: .semibold) : UIFont.systemFont(ofSize: 17)
        feld.textColor = UIColor(farben.schrift)
        feld.tintColor = UIColor(farben.blau)
        feld.attributedPlaceholder = NSAttributedString(string: platzhalter, attributes: [.foregroundColor: UIColor(farben.blass)])
        feld.keyboardType = zahl ? .decimalPad : .default
        feld.returnKeyType = .done
        feld.autocapitalizationType = .sentences
        feld.delegate = context.coordinator
        feld.addTarget(context.coordinator, action: #selector(Helfer.geaendert(_:)), for: .editingChanged)
        feld.setContentHuggingPriority(.defaultLow, for: .horizontal)
        feld.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        return feld
    }

    func updateUIView(_ feld: Feld, context: Context) {
        context.coordinator.eltern = self
        if feld.text != text { feld.text = text }
    }

    final class Feld: UITextField {
        override func didMoveToWindow() {
            super.didMoveToWindow()
            if window != nil { DispatchQueue.main.async { self.becomeFirstResponder() } }
        }
    }

    final class Helfer: NSObject, UITextFieldDelegate {
        var eltern: Eingabefeld
        init(_ eltern: Eingabefeld) { self.eltern = eltern }

        @objc func geaendert(_ feld: UITextField) { eltern.text = feld.text ?? "" }

        func textFieldShouldReturn(_ textField: UITextField) -> Bool {
            eltern.fertig()
            return false
        }
    }
}

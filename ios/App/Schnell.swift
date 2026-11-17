import SwiftUI
import UIKit
import WidgetKit

/// Schnelleingabe: Die Knöpfe „Notiz“ und „Ausgabe“ im Widget öffnen die App nur mit einem Eingabefeld (trackpunkt://schnell/notiz).
/// Nach dem Bestätigen geht die App von selbst zurück auf den Home-Bildschirm. Näher kommt man an ein Popup nicht heran:
/// Ein Widget darf selbst keine Tastatur zeigen.
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

    /// Betrag in Cent (deutsches Komma oder Punkt)
    private var cent: Double { ((Double(text.replacingOccurrences(of: ",", with: ".")) ?? 0) * 100).rounded() }
    private var gueltig: Bool { art == .notiz ? !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty : cent > 0 && cent <= 1e9 }

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        ZStack(alignment: .top) {
            // Tipp daneben bricht ab, aber nur solange nichts getippt ist: Ein Fehltipp soll keinen Text kosten
            f.seite.ignoresSafeArea().onTapGesture { if text.isEmpty && wofuer.isEmpty { schliessen() } }
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 10) {
                    Text(art == .notiz ? "Notiz" : "Ausgabe").font(.system(size: 13, weight: .semibold)).foregroundColor(f.blass)
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
                        TextField("Wofür? (kann leer bleiben)", text: $wofuer).font(.system(size: 15)).foregroundColor(f.schrift).tint(f.blau)
                            .submitLabel(.done).onSubmit(sichern)
                    }
                }
                .padding(16).background(f.grund).clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                Button("Abbrechen", action: schliessen).font(.system(size: 15)).foregroundColor(f.blass)
            }
            .padding(.horizontal, 16).padding(.top, 56)
        }
        .onAppear {
            // Nur für den Selbsttest im Bau: trägt von selbst etwas ein, damit geprüft ist, dass Speichern und Schließen gehen
            guard CommandLine.arguments.contains("-schnellprobe") else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { text = art == .notiz ? "Schnell notiert" : "4,20"; sichern() }
        }
    }

    private func sichern() {
        guard gueltig else { return }
        if art == .notiz {
            Ablage.notizDazu(text.trimmingCharacters(in: .whitespacesAndNewlines))
        } else {
            Ablage.vormerken(["art": "ausgabe", "a": cent, "n": wofuer.trimmingCharacters(in: .whitespacesAndNewlines), "kat": ""])
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

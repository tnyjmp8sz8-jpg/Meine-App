import SwiftUI
import UIKit
import WidgetKit

/// Schnelleingabe: Die Knöpfe „Notiz“, „Ausgabe“ und (ab 1.6) „Termin“ im Widget öffnen die App nur mit einem Eingabefeld (trackpunkt://schnell/notiz).
/// Nach dem Bestätigen geht die App von selbst zurück auf den Home-Bildschirm. Näher kommt man an ein Popup nicht heran:
/// Ein Widget darf selbst keine Tastatur zeigen.
/// Bei „Ausgabe“ lässt sich oben auf Einnahme umstellen und darunter das Konto wählen (seit 0.5), damit die Buchung gleich im Vermögen mitrechnet.
/// Bei „Termin“ (sein Wunsch 28.11.: „nur so Popup wie bei Ausgabe oder Notiz, schnell und smooth“; bis 1.5 öffnete der Knopf das Blatt in der App) steht alles in einem Satz
/// („Zahnarzt morgen 15 Uhr“, gelesen wie in der App, TerminLesen.swift), darunter was eingetragen wird und die Kalender, die er in der App zum Eintragen anbietet.
/// Der Termin geht sofort in den Kalender von Apple (nicht über die Web-App): So steht er auch im großen Widget gleich da.
enum Schnell: String {
    case notiz, ausgabe, termin

    /// Zurück auf den Home-Bildschirm, wie ein Druck auf die Home-Taste
    static func nachHause() {
        let wahl = NSSelectorFromString("suspend")
        if UIApplication.shared.responds(to: wahl) { UIApplication.shared.perform(wahl) }
    }

    /// Schließt, was gerade über der App gezeigt wird (Auswahl eines Ordners, Teilen-Menü): Die Schnelleingabe läge sonst darunter
    static func freiraeumen() {
        for szene in UIApplication.shared.connectedScenes {
            guard let fenster = szene as? UIWindowScene else { continue }
            for eins in fenster.windows { eins.rootViewController?.dismiss(animated: false) }
        }
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
    /// Ob der Nutzer selbst ein Konto angetippt hat: Danach ändert ein neuer Stand der App die Wahl nicht mehr
    @State private var selbst = false
    // Termin (ab 1.6): Kalender zur Wahl, gewählter Kalender (leer = der von iOS), Erinnerungen aus der App, Zugriff, Fehler beim Speichern
    @State private var kals: [Stand.Kal] = []
    @State private var kalender = ""
    @State private var kalVor = ""
    @State private var erZ: Double? = 60
    @State private var erG: Double? = nil
    @State private var recht = Termine.shared.zustand
    @State private var fehler = ""
    @State private var speichert = false

    /// Betrag in Cent (deutsches Komma oder Punkt)
    private var cent: Double { ((Double(text.replacingOccurrences(of: ",", with: ".")) ?? 0) * 100).rounded() }
    /// Bei Ausgabe und Einnahme: Betrag über 0 und, wenn es Konten gibt, eine Wahl (auch „Kein Konto“ ist eine)
    private var gueltig: Bool {
        if art == .notiz { return !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if art == .termin { return !lesung.t.isEmpty && recht == "an" && !speichert }
        return cent > 0 && cent <= 1e9 && (konten.isEmpty || konto != nil)
    }

    /// Was der Satz hergibt: Titel, Tag, Uhrzeit (wie in der App)
    private var lesung: TerminLesen.Ergebnis { TerminLesen.lesen(text, Date()) }

    var body: some View {
        let f = Farben(dunkel: schema == .dark)
        let frage = einnahme ? "Woher? (kann leer bleiben)" : "Wofür? (kann leer bleiben)"
        ZStack(alignment: .top) {
            // Tipp daneben bricht ab, aber nur solange nichts getippt ist: Ein Fehltipp soll keinen Text kosten
            f.seite.ignoresSafeArea().onTapGesture { if text.isEmpty && wofuer.isEmpty { schliessen() } }
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 10) {
                    if art != .ausgabe {
                        Text(art == .notiz ? "Notiz" : "Termin").font(.system(size: 13, weight: .semibold)).foregroundColor(f.blass)
                    } else {
                        HStack(spacing: 8) {
                            pille("Ausgabe", !einnahme, f) { einnahme = false }
                            pille("Einnahme", einnahme, f) { einnahme = true }
                        }
                        .padding(.vertical, -4)   // die Tippfläche der Pillen reicht je 4 pt über die Reihe hinaus (siehe pille)
                    }
                    HStack(spacing: 10) {
                        Eingabefeld(text: $text, platzhalter: art == .notiz ? "Was möchtest du notieren?" : art == .termin ? "z. B. Zahnarzt morgen 15 Uhr" : "0,00",
                                    zahl: art == .ausgabe, farben: f, fertig: sichern)
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
                            // Ohne Vorbelegung (mehrere Konten, noch keines benutzt) bleibt der Haken gesperrt, bis ein Konto oder „Kein Konto“ gewählt ist.
                            // Das steht dann hier, und sobald ein Betrag da ist, in Blau.
                            if konto == nil {
                                Text("Konto wählen").font(.system(size: 12, weight: .medium)).foregroundColor(cent > 0 ? f.blau : f.blass)
                            }
                            kontenReihe(f)
                        }
                    }
                    if art == .termin { terminTeil(f) }
                }
                .padding(16).background(f.grund).clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                Button("Abbrechen", action: schliessen).font(.system(size: 15)).foregroundColor(f.blass)
            }
            .padding(.horizontal, 16).padding(.top, 56)
        }
        // Nach einem Kaltstart aus dem Widget kommt der Stand der App erst, wenn die Eingabe schon zu sehen ist (bei der ersten Eingabe nach der
        // Installation kennt der alte Stand noch gar keine Konten): Dann die Konten neu lesen, solange der Nutzer noch keines angetippt hat.
        .onReceive(NotificationCenter.default.publisher(for: Halter.standNeu)) { _ in
            if !selbst { kontenLaden(); kalenderLaden() }
        }
        .onAppear {
            kontenLaden()
            kalenderLaden()
            // Noch nie gefragt: iOS fragt jetzt (die Abfrage liegt über der Eingabe); danach steht hier, ob er darf
            if art == .termin && recht == "fehlt" { Termine.shared.fragen { recht = Termine.shared.zustand } }
            // Nur für den Selbsttest im Bau: trägt von selbst etwas ein, damit geprüft ist, dass Speichern und Schließen gehen.
            // Bei „Ausgabe“ stellt die Probe dazu auf Einnahme und wählt das zweite Konto.
            guard CommandLine.arguments.contains("-schnellprobe") else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                if art == .notiz {
                    text = "Schnell notiert"
                } else if art == .termin {
                    text = "Track Schnellprobe morgen 15 Uhr"
                    if kals.count > 1 { kalender = kals[1].id; selbst = true }
                } else {
                    text = "4,20"
                    einnahme = true
                    if konten.count > 1 { konto = konten[1].id; selbst = true }
                }
                sichern()
            }
        }
    }

    /// Pille zum Wählen: gewählt blau mit weißer Schrift, sonst ruhig in der Schriftfarbe (wie die Chips im Blatt der App). Ein Tipp darauf lässt die Tastatur offen.
    /// Zu sehen sind 32 pt Höhe, die Tippfläche ist 40 pt hoch: oben und unten je 4 pt mehr. Die Reihe, in der die Pille steht, nimmt diese 4 pt
    /// mit einem negativen Rand wieder zurück, damit die Abstände bleiben.
    private func pille(_ titel: String, _ an: Bool, _ f: Farben, punkt: Color? = nil, _ tipp: @escaping () -> Void) -> some View {
        Button(action: tipp) {
            HStack(spacing: 6) {
                // Termin: der Punkt in der Farbe des Kalenders, wie in der App
                if let p = punkt { Circle().fill(p).frame(width: 7, height: 7).overlay(Circle().stroke(Color.white.opacity(an ? 0.9 : 0), lineWidth: 1)) }
                Text(titel).font(.system(size: 13, weight: .medium)).foregroundColor(an ? .white : f.schrift).lineLimit(1)
            }
            .padding(.horizontal, 12).frame(height: 32).background(an ? f.blau : f.spur).clipShape(Capsule())
            .padding(.vertical, 4).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    /// Termin: unter dem Feld, was eingetragen wird (Tag und Zeit, darunter der Titel, sobald der Satz Tag oder Zeit enthielt), dann die Kalender.
    /// Ohne Zugriff auf den Kalender steht dort statt dessen, wo er ihn erlaubt.
    @ViewBuilder private func terminTeil(_ f: Farben) -> some View {
        Rectangle().fill(f.spur).frame(height: 1)
        if recht == "nein" {
            HStack(spacing: 10) {
                Text("Track. darf den Kalender nicht benutzen.").font(.system(size: 14)).foregroundColor(f.blass)
                Spacer(minLength: 0)
                Button("Erlauben") {
                    if let ort = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(ort) }
                }
                .font(.system(size: 14, weight: .semibold)).foregroundColor(f.blau)
            }
        } else {
            let e = lesung, z = TerminLesen.zeiten(e, Date()), erkannt = e.d != nil || e.a != nil
            HStack(spacing: 8) {
                Image(systemName: "calendar").font(.system(size: 14, weight: .semibold)).foregroundColor(erkannt ? f.blau : f.blass)
                Text(Schnelleingabe.wann(z.s, z.e, z.g)).font(.system(size: 15, weight: erkannt ? .semibold : .regular)).foregroundColor(erkannt ? f.schrift : f.blass)
                    .lineLimit(1)
            }
            .animation(.easeOut(duration: 0.15), value: erkannt)
            if erkannt && !e.t.isEmpty {
                Text("Als „\(e.t)“").font(.system(size: 13)).foregroundColor(f.blass).lineLimit(1)
            }
            if !fehler.isEmpty { Text(fehler).font(.system(size: 13)).foregroundColor(Color(0xFF453A)).fixedSize(horizontal: false, vertical: true) }
            if kals.count > 1 {
                Rectangle().fill(f.spur).frame(height: 1)
                ScrollViewReader { leser in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(kals, id: \.id) { k in
                                pille(Schnelleingabe.kurz(k.n), kalender == k.id, f, punkt: farbeAus(k.f, f.blau)) { kalender = k.id; selbst = true }.id(k.id)
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                    .scrollDismissesKeyboard(.never)
                    .padding(.horizontal, -16).padding(.vertical, -4)
                    .onAppear { if !kalender.isEmpty { DispatchQueue.main.async { leser.scrollTo(kalender, anchor: .center) } } }
                }
            }
        }
    }

    /// „Morgen · 15:00–16:00“, „Heute · ganztägig“, „Fr., 4. Dez. · 20:15–21:15“
    static func wann(_ s: Date, _ e: Date, _ g: Bool) -> String {
        let kal = Calendar.current, heute = kal.startOfDay(for: Date()), tage = kal.dateComponents([.day], from: heute, to: kal.startOfDay(for: s)).day ?? 0
        let tag: String
        switch tage {
        case 0: tag = "Heute"
        case 1: tag = "Morgen"
        case 2: tag = "Übermorgen"
        default:
            let form = DateFormatter()
            form.locale = Locale(identifier: "de_DE")
            form.setLocalizedDateFormatFromTemplate(kal.component(.year, from: s) == kal.component(.year, from: heute) ? "EEEdMMM" : "EEEdMMMyyyy")
            tag = form.string(from: s)
        }
        if g { return tag + " · ganztägig" }
        let uhr = DateFormatter()
        uhr.locale = Locale(identifier: "de_DE")
        uhr.dateFormat = "HH:mm"
        return tag + " · " + uhr.string(from: s) + "–" + uhr.string(from: e)
    }

    /// Kalender und Erinnerungen aus dem letzten Stand der App (ab v147). Vorbelegt ist der Kalender, den auch das Blatt in der App nähme.
    /// Für die Bilder und die Probe im Bau: drei Beispielkalender („-schnellkonten“), im Simulator gibt es keine eigenen.
    private func kalenderLaden() {
        guard art == .termin else { return }
        let stand = Ablage.lesen()
        var liste = stand?.kals ?? []
        var vor = stand?.kal ?? ""
        if CommandLine.arguments.contains("-schnellkonten") {
            // Kennungen, die es im Kalender nicht gibt: Dann trägt iOS in den Kalender für neue Termine ein (siehe Termine.schreiben)
            liste = [Stand.Kal(id: "b1", n: "Privat", f: "#FF9F0A"), Stand.Kal(id: "b2", n: "Uni", f: "#CC73E1"), Stand.Kal(id: "b3", n: "Arbeit", f: "#FF453A")]
            vor = liste[0].id
        }
        kals = liste
        kalVor = vor
        if !selbst { kalender = liste.contains(where: { $0.id == vor }) ? vor : liste.first?.id ?? "" }
        if let stand = stand, stand.kals != nil { erZ = stand.erZ; erG = stand.erG }
    }

    /// Konten als Pillen in einer Reihe, die sich seitlich schieben lässt (so ist auch auf einem schmalen Gerät nichts abgeschnitten); am Ende „Kein Konto“.
    /// Die Reihe läuft links und rechts bis an den Rand der Karte (die Karte hat 16 pt Rand, die Pillen beginnen trotzdem bündig mit dem Rest):
    /// Geht es rechts weiter, ist so fast immer eine angeschnittene Pille zu sehen.
    private func kontenReihe(_ f: Farben) -> some View {
        ScrollViewReader { leser in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(konten, id: \.id) { eins in
                        pille(Schnelleingabe.kurz(eins.n), konto == eins.id, f) { konto = eins.id; selbst = true }.id(eins.id)
                    }
                    pille("Kein Konto", konto == "", f) { konto = ""; selbst = true }
                }
                .padding(.horizontal, 16)
            }
            .scrollDismissesKeyboard(.never)
            .padding(.horizontal, -16).padding(.vertical, -4)
            .onAppear {
                // Das vorbelegte Konto soll zu sehen sein, auch wenn es weiter hinten in der Reihe steht
                if let wahl = konto, !wahl.isEmpty { DispatchQueue.main.async { leser.scrollTo(wahl, anchor: .center) } }
            }
        }
    }

    /// Lange Kontonamen kürzen, damit eine Pille nicht die ganze Reihe füllt
    private static func kurz(_ name: String) -> String { name.count > 22 ? String(name.prefix(21)) + "…" : name }

    /// Konten aus dem letzten Stand der App. Vorbelegt ist das Konto, das die App im Blatt vorbelegen würde (zuletzt benutzt oder das einzige),
    /// wenn es noch in der Liste steht. Was hier schon gebucht, aber von der App noch nicht übernommen wurde, zählt dabei als „zuletzt benutzt“:
    /// das Konto des jüngsten Auftrags, der noch vorgemerkt ist. „Kein Konto“ wird nie von selbst gewählt.
    private func kontenLaden() {
        guard art == .ausgabe else { return }
        let stand = Ablage.lesen()
        var liste = stand?.konten ?? []
        var vor = stand?.konto ?? ""
        for auftrag in Ablage.eingang() {
            if auftrag["art"] as? String == "ausgabe", let acc = auftrag["acc"] as? String, !acc.isEmpty { vor = acc }
        }
        // Für die Bilder und die Probe im Bau: drei Beispielkonten statt des Stands. Mit „-schnelloffen“ ist keines vorbelegt (mehrere Konten, noch keines benutzt).
        if CommandLine.arguments.contains("-schnellkonten") {
            liste = [Stand.Konto(id: "b1", n: "Girokonto"), Stand.Konto(id: "b2", n: "Sparkonto"), Stand.Konto(id: "b3", n: "Depot")]
            vor = CommandLine.arguments.contains("-schnelloffen") ? "" : "b1"
        }
        konten = liste
        konto = liste.contains(where: { $0.id == vor }) ? vor : nil
    }

    private func sichern() {
        guard gueltig else { return }
        if art == .termin { return terminSichern() }
        if art == .notiz {
            Ablage.notizDazu(text.trimmingCharacters(in: .whitespacesAndNewlines))
        } else {
            var auftrag: [String: Any] = ["art": "ausgabe", "a": cent, "n": wofuer.trimmingCharacters(in: .whitespacesAndNewlines), "kat": "", "k": einnahme ? "in" : "out"]
            // acc nur, wenn es Konten gibt: die Kennung, leer heißt ausdrücklich „Kein Konto“. Ohne das Feld belegt die App wie bisher selbst vor.
            if !konten.isEmpty, let wahl = konto { auftrag["acc"] = wahl }
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

    /// Termin direkt in den Kalender von Apple: Geht es nicht, bleibt die Eingabe offen und sagt, warum.
    /// Ein anderer Kalender als der vorbelegte geht als Auftrag an die App (kalwahl): Dort ist er beim nächsten Termin vorbelegt, wie nach einer Wahl im Blatt.
    private func terminSichern() {
        let e = lesung, z = TerminLesen.zeiten(e, Date())
        var auftrag: [String: Any] = ["t": e.t, "s": (z.s.timeIntervalSince1970 * 1000).rounded(), "e": (z.e.timeIntervalSince1970 * 1000).rounded(), "g": z.g ? 1 : 0]
        if let minuten = z.g ? erG : erZ { auftrag["er"] = minuten } else { auftrag["er"] = NSNull() }
        if !kalender.isEmpty { auftrag["kal"] = kalender }
        speichert = true
        fehler = ""
        Termine.shared.speichern(auftrag) { grund in
            speichert = false
            if CommandLine.arguments.contains("-schnellprobe") { probeAblegen(auftrag, grund) }
            guard grund.isEmpty else {
                fehler = "Nicht gespeichert: " + grund
                UINotificationFeedbackGenerator().notificationOccurred(.error)
                return
            }
            if !kalender.isEmpty && kalender != kalVor {
                Ablage.vormerken(["art": "kalwahl", "kal": kalender])
                Ablage.kalGewaehlt(kalender)
                NotificationCenter.default.post(name: Halter.eingangDa, object: nil)
            }
            Termine.shared.widgetNeu()
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            schliessen()
        }
    }

    /// Nur in der Probe: Auftrag und Ergebnis ablegen, dazu ob der Termin im Kalender steht (danach wird er wieder gelöscht)
    private func probeAblegen(_ auftrag: [String: Any], _ grund: String) {
        var o: [String: Any] = ["t": auftrag["t"] ?? "", "g": auftrag["g"] ?? 0, "fehler": grund, "kal": auftrag["kal"] ?? ""]
        if let s = auftrag["s"] as? Double, let e = auftrag["e"] as? Double { o["minuten"] = Int((e - s) / 60000) }
        o["gefunden"] = Termine.shared.probeTitel(auftrag["t"] as? String ?? "")
        if let daten = try? JSONSerialization.data(withJSONObject: o) {
            try? daten.write(to: FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("schnellprobe.json"))
        }
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

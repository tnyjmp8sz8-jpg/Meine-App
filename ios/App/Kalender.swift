import CoreGraphics
import EventKit
import Foundation
import WidgetKit

/// Termine aus dem Kalender des iPhones (ab 1.3). Der Kalender von Apple bleibt der Speicher: Track. liest dort und schreibt dorthin,
/// legt aber selbst keine Termine ab. So bleiben iCloud, Einladungen, abonnierte Kalender, die Apple Watch und vor allem die Erinnerungen von Apple
/// (sie kommen auch, wenn Track. abgelaufen ist) wie sie sind.
/// Die Web-App bekommt die Termine von zwölf Monaten zurück bis dreizehn Monate voraus als Liste, je Termin:
/// id (Kennung im Kalender), s und e (Beginn und Ende in Millisekunden), t (Titel), g (ganztägig), o (Ort), w (lässt sich ändern),
/// r (wiederholt sich), er (Erinnerung in Minuten vor dem Beginn; negativ = danach), k und f (Name und Farbe des Kalenders).
/// Gefragt wird iOS erst, wenn die Web-App darum bittet (der Nutzer hat dort „Termin“ angetippt), nie beim Start.
final class Termine {
    static let shared = Termine()

    private var lager = EKEventStore()
    /// Alles, was das Lager anfasst, läuft nacheinander in dieser Reihe und nie im Vordergrund: Zwei Jahre Termine zu lesen kann spürbar dauern.
    private let reihe = DispatchQueue(label: "de.trackapp.track.kalender", qos: .userInitiated)
    private var beobachtet = false
    private var steht = false
    /// Der Kalender hat sich geändert (auch von außen, etwa über iCloud): Die Liste geht neu an die Web-App
    var melden: (() -> Void)?

    /// „an“: voller Zugriff · „fehlt“: iOS wurde noch nicht gefragt · „nein“: abgelehnt, gesperrt oder nur Schreiben erlaubt
    var zustand: String {
        switch EKEventStore.authorizationStatus(for: .event) {
        case .fullAccess: return "an"
        case .notDetermined: return "fehlt"
        default: return "nein"
        }
    }

    /// Fragt iOS nach dem Zugriff (die Abfrage erscheint nur beim ersten Mal). Danach ein frisches Lager: Eines von vor der Erlaubnis sieht die Termine nicht sicher.
    func fragen(_ dann: @escaping () -> Void) {
        guard zustand == "fehlt" else { return dann() }
        lager.requestFullAccessToEvents { _, _ in
            self.reihe.async {
                self.lager = EKEventStore()
                DispatchQueue.main.async { dann() }
            }
        }
    }

    private func beobachten() {
        guard !beobachtet else { return }
        beobachtet = true
        NotificationCenter.default.addObserver(forName: .EKEventStoreChanged, object: nil, queue: .main) { [weak self] _ in self?.geaendert() }
    }

    /// Mehrere Änderungen kurz hintereinander (ein Abgleich mit iCloud meldet sich oft mehrfach) ergeben eine Meldung
    private func geaendert() {
        guard !steht else { return }
        steht = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.steht = false
            self.melden?()
        }
    }

    private static func ms(_ zeit: Date) -> Double { (zeit.timeIntervalSince1970 * 1000).rounded() }
    private static func zahl(_ wert: Any?) -> Double? { (wert as? NSNumber)?.doubleValue }

    /// Liste für die Web-App; ohne Zugriff nur der Zustand
    func lesen(_ dann: @escaping ([String: Any]) -> Void) {
        let recht = zustand
        guard recht == "an" else { return dann(["recht": recht]) }
        beobachten()
        reihe.async {
            let antwort = self.liste(Date())
            // Für das große Widget (ab 1.4): heute bis übermorgen in die App-Gruppe; hat sich etwas geändert, zeichnet es neu
            if Tagesblick.merken(Tagesblick.ausKalender(self.lager, Date())) { WidgetCenter.shared.reloadTimelines(ofKind: "tag") }
            DispatchQueue.main.async { dann(antwort) }
        }
    }

    private func liste(_ jetzt: Date) -> [String: Any] {
        let kalender = Calendar.current, tag = kalender.startOfDay(for: jetzt)
        let von = kalender.date(byAdding: .month, value: -12, to: tag) ?? tag
        let bis = kalender.date(byAdding: .month, value: 13, to: tag) ?? tag
        var gefunden = lager.events(matching: lager.predicateForEvents(withStart: von, end: bis, calendars: nil))
        gefunden.sort { ($0.startDate ?? .distantPast) < ($1.startDate ?? .distantPast) }
        // Sehr volle Kalender: lieber Vergangenes weglassen als Kommendes
        if gefunden.count > 4000 {
            let grenze = tag.addingTimeInterval(-31 * 86400)
            gefunden = gefunden.filter { ($0.endDate ?? .distantPast) >= grenze }
        }
        let eintraege: [[String: Any]] = gefunden.prefix(4000).compactMap { Termine.eintrag($0) }
        return ["recht": "an", "von": Termine.ms(von), "bis": Termine.ms(bis), "liste": eintraege, "kals": schreibbare()]
    }

    /// Die Kalender, in die neue Termine dürfen (eigene und geteilte mit Schreibrecht), der für neue Termine gewählte zuerst (ab 1.4).
    /// Je id, n Name, f Farbe, std = der Kalender, den iOS für neue Termine nimmt.
    private func schreibbare() -> [[String: Any]] {
        let std = lager.defaultCalendarForNewEvents?.calendarIdentifier ?? ""
        let alle = lager.calendars(for: .event).filter { $0.allowsContentModifications }
            .sorted { ($0.calendarIdentifier == std ? 0 : 1, $0.title.lowercased()) < ($1.calendarIdentifier == std ? 0 : 1, $1.title.lowercased()) }
        return alle.prefix(40).map { k in
            var o: [String: Any] = ["id": k.calendarIdentifier, "n": String(k.title.prefix(60))]
            if let f = Tagesblick.farbe(k.cgColor) { o["f"] = f }
            if k.calendarIdentifier == std { o["std"] = 1 }
            return o
        }
    }

    private static func eintrag(_ termin: EKEvent) -> [String: Any]? {
        guard let id = termin.eventIdentifier, let beginn = termin.startDate, let ende = termin.endDate, termin.status != .canceled else { return nil }
        var o: [String: Any] = ["id": id, "s": ms(beginn), "e": ms(ende), "t": String((termin.title ?? "").prefix(200))]
        if termin.isAllDay { o["g"] = 1 }
        if let ort = termin.location, !ort.isEmpty { o["o"] = String(ort.prefix(120)) }
        if termin.hasRecurrenceRules { o["r"] = 1 }
        if let alarm = termin.alarms?.first(where: { $0.absoluteDate == nil }) { o["er"] = (-alarm.relativeOffset / 60).rounded() }
        if let kalender = termin.calendar {
            if kalender.allowsContentModifications { o["w"] = 1 }
            o["k"] = String(kalender.title.prefix(60))
            o["ki"] = kalender.calendarIdentifier
            if let f = Tagesblick.farbe(kalender.cgColor) { o["f"] = f }
        }
        return o
    }

    /// Ein Termin, der sich wiederholt, hat für jedes Vorkommen dieselbe Kennung: Das richtige findet der Beginn (s0), wie ihn die Liste genannt hat.
    private func finden(_ id: String, _ beginn: Double?) -> EKEvent? {
        if let beginn = beginn {
            let zeit = Date(timeIntervalSince1970: beginn / 1000)
            let nah = lager.events(matching: lager.predicateForEvents(withStart: zeit.addingTimeInterval(-86400), end: zeit.addingTimeInterval(86400), calendars: nil))
                .filter { $0.eventIdentifier == id }
            if let genau = nah.first(where: { abs(($0.startDate ?? .distantPast).timeIntervalSince(zeit)) < 1 }) { return genau }
            if let einer = nah.first { return einer }
        }
        return lager.event(withIdentifier: id)
    }

    /// Auftrag der Web-App: { id und s0 (nur beim Ändern), t, s, e, g, o, er, kal }. kal (ab 1.4): Kennung des Kalenders, in den der Termin soll. Ohne id entsteht ein neuer Termin im Kalender,
    /// den der Nutzer in iOS für neue Termine gewählt hat. „er“ fehlt: Erinnerungen bleiben, wie sie sind; eine Zahl: Minuten vor dem Beginn; sonst: keine.
    /// Geändert wird bei einem Termin, der sich wiederholt, nur dieses eine Vorkommen. Ergebnis: leer oder der Grund, warum es nicht ging.
    func speichern(_ auftrag: [String: Any], _ dann: @escaping (String) -> Void) {
        guard zustand == "an" else { return dann("Track. darf den Kalender nicht benutzen.") }
        reihe.async {
            let fehler = self.schreiben(auftrag)
            DispatchQueue.main.async { dann(fehler) }
        }
    }

    private func schreiben(_ a: [String: Any]) -> String {
        let titel = ((a["t"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard let s = Termine.zahl(a["s"]), let e = Termine.zahl(a["e"]), e >= s, !titel.isEmpty else { return "Der Termin ist unvollständig." }
        let termin: EKEvent
        if let id = a["id"] as? String, !id.isEmpty {
            guard let alt = finden(id, Termine.zahl(a["s0"])) else { return "Den Termin gibt es nicht mehr." }
            termin = alt
        } else {
            guard let kalender = lager.defaultCalendarForNewEvents else { return "Auf dem iPhone ist kein Kalender für neue Termine eingerichtet." }
            termin = EKEvent(eventStore: lager)
            termin.calendar = kalender
        }
        guard termin.calendar?.allowsContentModifications == true else { return "Dieser Kalender lässt sich nicht ändern." }
        // Anderer Kalender (ab 1.4): nur einer, in den er schreiben darf, und nicht für ein einzelnes Vorkommen eines Termins, der sich wiederholt
        if let kid = a["kal"] as? String, !kid.isEmpty, let ziel = lager.calendar(withIdentifier: kid), ziel.allowsContentModifications, !termin.hasRecurrenceRules {
            termin.calendar = ziel
        }
        termin.title = String(titel.prefix(200))
        termin.isAllDay = (a["g"] as? NSNumber)?.boolValue ?? false
        termin.startDate = Date(timeIntervalSince1970: s / 1000)
        termin.endDate = Date(timeIntervalSince1970: e / 1000)
        if let ort = a["o"] as? String { termin.location = ort.isEmpty ? nil : String(ort.prefix(120)) }
        if let erinnerung = a["er"] {
            termin.alarms = nil
            if let minuten = Termine.zahl(erinnerung) { termin.addAlarm(EKAlarm(relativeOffset: -minuten * 60)) }
        }
        do { try lager.save(termin, span: .thisEvent, commit: true) } catch { return error.localizedDescription }
        return ""
    }

    /// Löscht einen Termin ({ id, s0 }), bei einem, der sich wiederholt, nur dieses Vorkommen. Ist er schon weg, gilt das als gelungen.
    func loeschen(_ auftrag: [String: Any], _ dann: @escaping (String) -> Void) {
        guard zustand == "an" else { return dann("Track. darf den Kalender nicht benutzen.") }
        reihe.async {
            let fehler = self.entfernen(auftrag)
            DispatchQueue.main.async { dann(fehler) }
        }
    }

    private func entfernen(_ a: [String: Any]) -> String {
        guard let id = a["id"] as? String, !id.isEmpty, let termin = finden(id, Termine.zahl(a["s0"])) else { return "" }
        guard termin.calendar?.allowsContentModifications == true else { return "Dieser Kalender lässt sich nicht ändern." }
        do { try lager.remove(termin, span: .thisEvent, commit: true) } catch { return error.localizedDescription }
        return ""
    }

    /// Selbsttest im Simulator (der Zugriff ist dort vorab erlaubt, siehe bau.sh): anlegen, lesen, ändern, löschen.
    /// Erwartet „an|1|60|30|1|0|1|k“: ein Termin gefunden, 60 Minuten lang, Erinnerung 30 Minuten vorher, nach dem Umbenennen einer mit neuem Namen, nach dem Löschen keiner;
    /// dazu (ab 1.4) fand ihn auch die Liste für das große Widget einmal, und es gibt mindestens einen Kalender zur Wahl (k).
    func pruefung() -> String {
        guard zustand == "an" else { return zustand }
        return reihe.sync { self.probe() }
    }

    private func probe() -> String {
        let kalender = Calendar.current
        let beginn = (kalender.date(byAdding: .day, value: 1, to: kalender.startOfDay(for: Date())) ?? Date()).addingTimeInterval(10 * 3600)
        let name = "Track Selbsttest \(Int(Date().timeIntervalSince1970))"
        let s = Termine.ms(beginn), e = Termine.ms(beginn.addingTimeInterval(3600))
        let mit = { (titel: String) -> [[String: Any]] in ((self.liste(Date())["liste"] as? [[String: Any]]) ?? []).filter { ($0["t"] as? String) == titel } }
        let f1 = schreiben(["t": name, "s": s, "e": e, "er": 30, "kal": lager.defaultCalendarForNewEvents?.calendarIdentifier ?? ""])
        let l1 = mit(name)
        let imWidget = Tagesblick.ausKalender(lager, Date()).filter { $0.t == name }.count
        let wahl = schreibbare().isEmpty ? "-" : "k"
        guard f1.isEmpty, let erster = l1.first, let id = erster["id"] as? String else { return "an|anlegen|\(f1)" }
        let minuten = Int(((Termine.zahl(erster["e"]) ?? 0) - (Termine.zahl(erster["s"]) ?? 0)) / 60000)
        let erinnerung = Int(Termine.zahl(erster["er"]) ?? -1)
        let f2 = schreiben(["id": id, "s0": s, "t": name + " neu", "s": s, "e": e])
        let l2 = mit(name + " neu")
        let f3 = entfernen(["id": id, "s0": s])
        let l3 = mit(name).count + mit(name + " neu").count
        return "an|\(l1.count)|\(minuten)|\(erinnerung)|\(l2.count)|\(l3)|\(imWidget)|\(wahl)" + (f2.isEmpty && f3.isEmpty ? "" : "|\(f2)|\(f3)")
    }
}

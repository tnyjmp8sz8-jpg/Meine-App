import Foundation
import HealthKit
import SwiftUI
import UserNotifications

/// Das Profil, mit dem die App signiert wurde (liegt bei Installationen über AltStore in der App). Daraus: wann sie abläuft und was freigegeben ist.
enum Profil {
    static let inhalt: [String: Any]? = {
        guard let ort = Bundle.main.url(forResource: "embedded", withExtension: "mobileprovision"), let daten = try? Data(contentsOf: ort),
              let text = String(data: daten, encoding: .isoLatin1), let anfang = text.range(of: "<?xml"), let ende = text.range(of: "</plist>") else { return nil }
        let liste = try? PropertyListSerialization.propertyList(from: Data(text[anfang.lowerBound..<ende.upperBound].utf8), options: [], format: nil)
        return liste as? [String: Any]
    }()

    static var ablauf: Date? { inhalt?["ExpirationDate"] as? Date }
    static func darf(_ recht: String) -> Bool { (inhalt?["Entitlements"] as? [String: Any])?[recht] != nil }
}

/// Lokale Mitteilungen: Sicherung fällig, App läuft ab. Ohne Ton.
enum Mitteilungen {
    struct Termin {
        let id: String
        let wann: Date
        let titel: String
        let text: String
    }

    /// Reine Rechnung (der Selbsttest prüft sie):
    /// Sicherung: am Tag der Fälligkeit um 18 Uhr, danach alle drei Tage wieder, höchstens fünf im Voraus. Wird gesichert, plant die App neu.
    /// Fällig heißt: Seit sieben Tagen liegt keine Sicherung außerhalb der App. Legt die App von selbst eine Kopie in einen gewählten Ordner,
    /// schickt die Web-App keinen Tag (leer), und es gibt keine Mitteilung. Was zu tun ist (Ordner wählen oder von Hand sichern), steht auf Heute.
    /// Ablauf: einen Tag bevor die App abläuft. Erneuert sie sich vorher von selbst, verschiebt sich der Termin beim nächsten Öffnen.
    static func plan(sicherung: String, ablauf: Date?, jetzt: Date = Date()) -> [Termin] {
        var liste: [Termin] = []
        let kalender = Calendar.current
        if let tag = Ablage.datum(sicherung), let erste = kalender.date(bySettingHour: 18, minute: 0, second: 0, of: tag) {
            var k = 0
            while liste.count < 5 && k < 400 {
                if let wann = kalender.date(byAdding: .day, value: 3 * k, to: erste), wann > jetzt {
                    liste.append(Termin(id: "sicherung-\(liste.count)", wann: wann, titel: "Sicherung fällig", text: "Seit einer Woche gibt es keine neue Sicherung außerhalb der App. Öffne Track.: Auf Heute steht, was zu tun ist."))
                }
                k += 1
            }
        }
        if let ablauf = ablauf, let wann = kalender.date(byAdding: .hour, value: -24, to: ablauf), wann > jetzt {
            liste.append(Termin(id: "ablauf", wann: wann, titel: "Track. läuft morgen ab", text: "Hänge das iPhone im WLAN ans Ladegerät oder tippe in AltStore auf „Refresh All“."))
        }
        return liste
    }

    /// Fragt beim ersten Mal nach der Erlaubnis und ersetzt alle geplanten Mitteilungen durch den neuen Plan
    static func planen(sicherung: String, ablauf: Date?) {
        let zentrale = UNUserNotificationCenter.current()
        zentrale.requestAuthorization(options: [.alert]) { erlaubt, _ in
            zentrale.removeAllPendingNotificationRequests()
            guard erlaubt else { return }
            for termin in plan(sicherung: sicherung, ablauf: ablauf) {
                let inhalt = UNMutableNotificationContent()
                inhalt.title = termin.titel
                inhalt.body = termin.text
                let zeit = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: termin.wann)
                zentrale.add(UNNotificationRequest(identifier: termin.id, content: inhalt, trigger: UNCalendarNotificationTrigger(dateMatching: zeit, repeats: false)))
            }
        }
    }
}

/// Läufe aus Health. Geht nur, wenn die Installation die Freigabe für Health trägt (steht im Profil); sonst bleibt alles hier ohne Wirkung.
final class Gesundheit {
    static let shared = Gesundheit()
    private let lager = HKHealthStore()
    private let merker = "health.verbunden"

    /// „fehlt“: in dieser Installation nicht freigegeben · „kann“: freigegeben, noch nicht verbunden · „an“: verbunden
    var zustand: String {
        guard HKHealthStore.isHealthDataAvailable(), Profil.darf("com.apple.developer.healthkit") else { return "fehlt" }
        return UserDefaults.standard.bool(forKey: merker) ? "an" : "kann"
    }

    /// Zeigt die Abfrage von Apple („Track. möchte auf Health zugreifen“)
    func verbinden(_ fertig: @escaping () -> Void) {
        guard zustand != "fehlt", let puls = HKObjectType.quantityType(forIdentifier: .heartRate), let strecke = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) else { return fertig() }
        lager.requestAuthorization(toShare: nil, read: [HKObjectType.workoutType(), puls, strecke]) { ok, _ in
            if ok { UserDefaults.standard.set(true, forKey: self.merker) }
            DispatchQueue.main.async(execute: fertig)
        }
    }

    /// Lauf-Trainings der letzten 30 Tage, so aufbereitet, wie die Web-App sie erwartet. Doppeltes sortiert die Web-App aus.
    func laeufe(_ fertig: @escaping ([[String: Any]]) -> Void) {
        guard zustand == "an", let seit = Calendar.current.date(byAdding: .day, value: -30, to: Date()),
              let pulsArt = HKObjectType.quantityType(forIdentifier: .heartRate), let streckeArt = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) else { return fertig([]) }
        let filter = NSCompoundPredicate(andPredicateWithSubpredicates: [HKQuery.predicateForWorkouts(with: .running), HKQuery.predicateForSamples(withStart: seit, end: nil, options: [])])
        let abfrage = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: filter, limit: 200, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, proben, _ in
            let liste: [[String: Any]] = (proben ?? []).compactMap { probe in
                guard let training = probe as? HKWorkout else { return nil }
                let meter = training.statistics(for: streckeArt)?.sumQuantity()?.doubleValue(for: .meter()) ?? 0
                guard meter.isFinite, meter >= 50, training.duration.isFinite else { return nil }
                var lauf: [String: Any] = ["id": training.uuid.uuidString, "t": training.startDate.timeIntervalSince1970 * 1000, "m": meter, "s": training.duration,
                                           "k": (training.metadata?[HKMetadataKeyIndoorWorkout] as? Bool) == true ? "in" : "out"]
                if let puls = training.statistics(for: pulsArt)?.averageQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute())), puls.isFinite { lauf["hr"] = puls }
                return lauf
            }
            DispatchQueue.main.async { fertig(liste) }
        }
        lager.execute(abfrage)
    }
}

/// Nur für das Bild aus dem Simulator (Start mit „-widgetbild“): zeigt den Inhalt des Widgets in den Größen des iPhones, dunkel und hell
struct WidgetVorschau: View {
    var body: some View {
        let dunkel = Farben(dunkel: true), hell = Farben(dunkel: false), stand = Stand.beispiel
        ZStack {
            LinearGradient(colors: [Color(0x27324A), Color(0x0B0D14)], startPoint: .top, endPoint: .bottom).ignoresSafeArea()
            VStack(spacing: 16) {
                kachel(NotizenAnsicht(notizen: stand.nz ?? [], zeilen: 3, knoepfe: true, f: dunkel), dunkel, 338)
                HStack(spacing: 22) { kachel(NotizenAnsicht(notizen: stand.nz ?? [], zeilen: 3, knoepfe: false, f: dunkel), dunkel, 158); kachel(NotizenAnsicht(notizen: stand.nz ?? [], zeilen: 3, knoepfe: false, f: hell), hell, 158) }
                kachel(NotizenAnsicht(notizen: stand.nz ?? [], zeilen: 3, knoepfe: true, f: hell), hell, 338)
            }
        }
    }

    private func kachel<Inhalt: View>(_ inhalt: Inhalt, _ f: Farben, _ breite: CGFloat) -> some View {
        inhalt.padding(16).frame(width: breite, height: 158).background(f.grund).clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

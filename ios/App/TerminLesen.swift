import Foundation

/// Liest Tag und Uhrzeit aus einem Satz wie „Zahnarzt morgen 15 Uhr“ (für die Schnelleingabe „Termin“, ab 1.6).
/// Dieselben Regeln wie terminLesen() in der Web-App (index.html): Was dort erkannt wird, muss hier genauso erkannt werden. Änderungen immer an beiden Stellen.
/// Ergebnis: t der Titel ohne die erkannten Wörter, d der Tag (JJJJ-MM-TT) oder nil, a und b Beginn und Ende in Minuten oder nil (dann ganztägig).
enum TerminLesen {
    struct Ergebnis: Equatable {
        var t: String
        var d: String?
        var a: Int?
        var b: Int?
    }

    private static let wtag: [String: Int] = ["montag": 0, "dienstag": 1, "mittwoch": 2, "donnerstag": 3, "freitag": 4, "samstag": 5, "sonnabend": 5, "sonntag": 6,
                                              "mo": 0, "di": 1, "mi": 2, "do": 3, "fr": 4, "sa": 5, "so": 6]
    private static let monK = ["jan", "feb", "mär", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"]

    static var kalender: Calendar {
        var k = Calendar(identifier: .gregorian)
        k.timeZone = .current
        return k
    }

    /// Tag als Schlüssel JJJJ-MM-TT in Ortszeit, wie keyOf() in der Web-App
    static func schluessel(_ zeit: Date) -> String {
        let t = kalender.dateComponents([.year, .month, .day], from: zeit)
        return String(format: "%04d-%02d-%02d", t.year ?? 0, t.month ?? 0, t.day ?? 0)
    }

    /// Wochentag mit Montag = 0, wie wd() in der Web-App
    private static func wd(_ zeit: Date) -> Int { (kalender.component(.weekday, from: zeit) + 5) % 7 }

    static func lesen(_ text: String, _ jetzt: Date) -> Ergebnis {
        let kal = kalender
        let roh = text.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression).trimmingCharacters(in: .whitespaces)
        var s = " " + roh + " "
        var d: String? = nil, a: Int? = nil, b: Int? = nil
        let heute = kal.date(bySettingHour: 12, minute: 0, second: 0, of: jetzt) ?? jetzt
        let y0 = kal.component(.year, from: heute), m0 = kal.component(.month, from: heute), t0 = kal.component(.day, from: heute)
        let tk = schluessel(heute)

        /// Der erste Treffer, den f annimmt, verschwindet aus dem Satz. Jedes Muster beginnt hinter einem Leer- oder Satzzeichen (Gruppe 1, bleibt stehen).
        /// f bekommt die Gruppen (fehlende als nil) und den Satz bis einschließlich dieses Zeichens.
        func nimm(_ muster: String, _ f: ([String?], String) -> Bool) -> Bool {
            guard let re = try? NSRegularExpression(pattern: muster, options: [.caseInsensitive]) else { return false }
            let ns = s as NSString
            for m in re.matches(in: s, range: NSRange(location: 0, length: ns.length)) {
                let g: [String?] = (0..<m.numberOfRanges).map { i in
                    let r = m.range(at: i)
                    return r.location == NSNotFound ? nil : ns.substring(with: r)
                }
                if f(g, ns.substring(to: m.range.location + 1)) {
                    s = ns.replacingCharacters(in: m.range, with: (g[1] ?? "") + " ")
                    return true
                }
            }
            return false
        }
        func zahl(_ x: String?) -> Int { Int(x ?? "") ?? 0 }
        func minute(_ h: String?, _ m: String?) -> Int? {
            let hh = zahl(h), mm = zahl(m)
            return hh == 24 ? (mm != 0 ? nil : 0) : hh * 60 + mm
        }
        func zeit(_ h1: String?, _ m1: String?, _ h2: String? = nil, _ m2: String? = nil) -> Bool {
            guard let x = minute(h1, m1) else { return false }
            var y: Int? = nil
            if h2 != nil {
                guard let z = minute(h2, m2) else { return false }
                y = z
            }
            a = x
            b = y ?? (x + 60) % 1440
            return true
        }

        let A = "([ ,(])", E0 = "(?=[ ,;:!?)])", E = #"(?=[ ,;:!?)]|\.(?: |$))"#, T = #"([01]?\d|2[0-4])(?:[:.]([0-5]\d))?"#, BIS = " ?(?:-|–|bis) ?"
        /// Von mehreren Mustern gilt das erste, das passt (wie die Kette mit || in der Web-App)
        func erstes(_ liste: [() -> Bool]) { for f in liste where f() { return } }
        erstes([
            { nimm("\(A)(?:von |ab )?\(T)(?: ?uhr)?\(BIS)\(T) ?uhr\(E)") { g, _ in zeit(g[2], g[3], g[4], g[5]) } },                    // 9-11 Uhr · von 9.30 bis 11 Uhr
            { nimm(#"\#(A)(?:von |ab )?(\d{1,2}):(\d\d)\#(BIS)(\d{1,2})(?::(\d\d))?\#(E)"#) { g, _ in
                zahl(g[2]) < 25 && zahl(g[3]) < 60 && zahl(g[4]) < 25 && zahl(g[5]) < 60 && zeit(g[2], g[3], g[4], g[5]) } },                  // 9:30-11
            { nimm(#"\#(A)(?:von |ab )?(\d{1,2})\#(BIS)(\d{1,2}):(\d\d)\#(E)"#) { g, _ in
                zahl(g[2]) < 25 && zahl(g[3]) < 25 && zahl(g[4]) < 60 && zeit(g[2], "0", g[3], g[4]) } },                                    // 9-11:30
            { nimm("\(A)von \(T) bis \(T)\(E)") { g, _ in zeit(g[2], g[3], g[4], g[5]) } },                                                 // von 9 bis 11
            { nimm("\(A)(?:um |ab |gegen )?\(T) ?uhr\(E)") { g, _ in zeit(g[2], g[3]) } },                                                   // 15 Uhr · um 15.30 Uhr
            { nimm(#"\#(A)(?:um |ab |gegen )?(\d{1,2}):(\d\d)\#(E)"#) { g, _ in zahl(g[2]) < 25 && zahl(g[3]) < 60 && zeit(g[2], g[3]) } },   // 15:30
            { nimm("\(A)(?:um|gegen) \(T)\(E)") { g, _ in zeit(g[2], g[3]) } }                                                               // um 15
        ])

        /// Ein Datum ohne Jahr meint das nächste Mal: Liegt es in diesem Jahr schon zurück, gilt das kommende
        func datum(_ tag: Int, _ mon: Int, _ jahr: Int?) -> Bool {
            var y = jahr.map { $0 < 100 ? 2000 + $0 : $0 } ?? y0
            func pass() -> Bool {
                guard mon >= 1, mon <= 12, tag >= 1, let erster = kal.date(from: DateComponents(year: y, month: mon, day: 1)),
                      let tage = kal.range(of: .day, in: .month, for: erster) else { return false }
                return tag <= tage.count
            }
            let k = { String(format: "%04d-%02d-%02d", y, mon, tag) }
            if jahr == nil && pass() && k() < tk { y += 1 }
            if !pass() || y < y0 - 1 || y > y0 + 5 { return false }
            d = k()
            return true
        }
        func tagPlus(_ n: Int) -> String { schluessel(kal.date(byAdding: .day, value: n, to: heute) ?? heute) }
        func wochentag(_ name: String?) -> Bool {
            guard let w = wtag[(name ?? "").lowercased()] else { return false }
            let n = (w - wd(heute) + 7) % 7
            d = tagPlus(n == 0 ? 7 : n)
            return true
        }
        let MONATE = "januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember|jan|feb|mär|apr|jun|jul|aug|sept|sep|okt|nov|dez"
        erstes([
            { nimm(#"\#(A)(?:am |den |ab )?(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?\#(E)"#) { g, _ in datum(zahl(g[2]), zahl(g[3]), g[4].flatMap { Int($0) }) } },   // 12.3. · 12.03.2027
            { nimm(#"\#(A)am (\d{1,2})\.(\d{1,2})\#(E)"#) { g, _ in datum(zahl(g[2]), zahl(g[3]), nil) } },                                                       // am 12.3
            { nimm(#"\#(A)(?:am |den )?(\d{1,2})\.? ?(\#(MONATE))\.?(?: (\d{4}))?\#(E)"#) { g, _ in                                                          // 3. Dezember · 3 dez 2027
                let k = String((g[3] ?? "").lowercased().prefix(3))
                let mon: Int = k == "mae" ? 3 : (monK.firstIndex(of: k) ?? -1) + 1
                return datum(zahl(g[2]), mon, g[4].flatMap { Int($0) })
            } },
            { nimm(#"\#(A)am (\d{1,2})\.\#(E)"#) { g, _ in                                                                                                         // am 12.
                let t = zahl(g[2])
                guard let x = kal.date(from: DateComponents(year: y0, month: m0 + (t < t0 ? 1 : 0), day: 1)) else { return false }
                return datum(t, kal.component(.month, from: x), kal.component(.year, from: x))
            } },
            { nimm("\(A)(heute(?: morgen| früh)?|übermorgen|uebermorgen|morgen)\(E)") { g, davor in                                                               // „am Morgen“ und „guten Morgen“ sind kein Tag
                let w = (g[2] ?? "").lowercased()
                if w == "morgen", davor.range(of: "(^| )(am|guten|jeden|früh) $", options: [.regularExpression, .caseInsensitive]) != nil { return false }
                d = tagPlus(w == "morgen" ? 1 : w.hasPrefix("h") ? 0 : 2)
                return true
            } },
            { nimm("\(A)(?:am |(?:nächste[nrs]?|kommende[nr]?) )?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag)\(E)") { g, _ in wochentag(g[2]) } },
            { nimm("\(A)(?:am )?(mo|di|mi|fr|sa)\(E0)") { g, _ in wochentag(g[2]) } },                                                                           // Kürzel nur ohne Punkt: „Fr.“ ist Frau
            { nimm("\(A)am (do|so)\(E0)") { g, _ in wochentag(g[2]) } }
        ])

        if d == nil && a == nil { return Ergebnis(t: roh, d: nil, a: nil, b: nil) }
        var t = s.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
        t = t.replacingOccurrences(of: #" ([,.;:!?])"#, with: "$1", options: .regularExpression).trimmingCharacters(in: .whitespaces)
        t = t.replacingOccurrences(of: #"^[,;:–-]+ ?| ?[,;:–-]+$"#, with: "", options: .regularExpression)
        t = t.replacingOccurrences(of: #" (am|um|ab|von|bis|den|gegen)$"#, with: "", options: [.regularExpression, .caseInsensitive]).trimmingCharacters(in: .whitespaces)
        return Ergebnis(t: t, d: d, a: a, b: b)
    }

    /// Beginn und Ende als Zeitpunkte: ohne Uhrzeit ganztägig (0:00 bis 23:59 des Tags, wie in der Web-App), ohne Tag heute, ein Ende vor dem Beginn am Tag darauf
    static func zeiten(_ e: Ergebnis, _ jetzt: Date) -> (s: Date, e: Date, g: Bool) {
        let kal = kalender
        var tag = kal.startOfDay(for: jetzt)
        if let d = e.d {
            let teile = d.split(separator: "-").compactMap { Int($0) }
            if teile.count == 3, let x = kal.date(from: DateComponents(year: teile[0], month: teile[1], day: teile[2])) { tag = x }
        }
        guard let a = e.a else {
            return (tag, kal.date(bySettingHour: 23, minute: 59, second: 0, of: tag) ?? tag, true)
        }
        let b = e.b ?? (a + 60) % 1440
        let beginn = kal.date(byAdding: .minute, value: a, to: tag) ?? tag
        let ende = kal.date(byAdding: .minute, value: b + (b < a ? 1440 : 0), to: tag) ?? beginn
        return (beginn, ende, false)
    }

    /// Selbsttest im Bau (Rechnung von Hand, jetzt = Samstag, 28.11.2026, 10 Uhr):
    /// „Zahnarzt morgen 15 Uhr“ → Sonntag 29.11., 15–16 Uhr (900, 960) · „Kino am Freitag 20:15“ → Freitag 4.12. (Samstag + 6), 20:15–21:15 (1215, 1275) ·
    /// „Klausur 3. Dezember 9-11 Uhr“ → 3.12., 540–660 · „Treffen am 2.1. um 9“ → 2.1.2027 (der 2.1.2026 ist vorbei), 540–600 ·
    /// „guten Morgen sagen“ → kein Tag, Titel bleibt · „Urlaub 24.12.“ → ganztägig am 24.12.
    static func pruefung() -> String {
        let jetzt = kalender.date(from: DateComponents(year: 2026, month: 11, day: 28, hour: 10)) ?? Date()
        return ["Zahnarzt morgen 15 Uhr", "Kino am Freitag 20:15", "Klausur 3. Dezember 9-11 Uhr", "Treffen am 2.1. um 9", "guten Morgen sagen", "Urlaub 24.12."].map { satz in
            let e = lesen(satz, jetzt)
            return "\(e.t)|\(e.d ?? "-")|\(e.a.map(String.init) ?? "-")|\(e.b.map(String.init) ?? "-")"
        }.joined(separator: ";")
    }
}

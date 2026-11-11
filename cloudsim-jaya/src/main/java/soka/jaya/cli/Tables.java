package soka.jaya.cli;

import soka.jaya.report.Summary;

import java.io.PrintStream;
import java.util.List;
import java.util.Locale;

/** Tabel perbandingan algoritma di terminal, dipakai {@code run}, {@code custom}, dan wizard. */
final class Tables {
    private static final Locale ID = Locale.forLanguageTag("id-ID");

    private Tables() {
    }

    static void print(PrintStream out, List<Summary.ScenarioSummary> summaries) {
        for (Summary.ScenarioSummary s : summaries) {
            out.printf("%s  (%s, %d task, %d VM)%n", s.id(), s.dataset().equals("nasa") ? "NASA iPSC" : "GoCJ",
                    s.tasks(), s.vms());
            out.println("  Algoritma          Run   Makespan (s) rata-rata ± std   Terbaik      CloudSim     Selisih  ARU     DOI    Respons (s)");
            for (Summary.AlgorithmSummary a : s.results()) {
                out.printf(ID, "  %-17s %4d   %,14.1f ± %-11.1f %,11.1f  %,11.1f  %6.3f%%  %5.1f%%  %5.2f  %,11.1f%n",
                        a.algorithm(), a.runs(), a.makespan().mean(), a.makespan().std(), a.makespan().min(),
                        a.makespanCloudSim().mean(), a.gapPercentMax(), 100 * a.aru().mean(), a.doi().mean(),
                        a.avgResponse().mean());
            }
            out.println();
        }
    }
}

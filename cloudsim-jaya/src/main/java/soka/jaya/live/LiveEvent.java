package soka.jaya.live;

import soka.jaya.report.RunRecord;
import soka.jaya.report.Summary;

import java.util.List;
import java.util.Map;

/**
 * Event simulasi live yang dipancarkan {@link LiveSession}. Tampilan terminal
 * ({@code LiveView}) adalah pelanggannya; tes memakainya untuk memeriksa urutan proses.
 */
public sealed interface LiveEvent {

    /** Satu baris log. {@code level}: info, ok, warn, atau error. */
    record Log(String level, String text) implements LiveEvent {
    }

    /** Simulasi dimulai. {@code vms} berformat sama dengan file replay website. */
    record Started(String id, String command, Map<String, String> request, String scenario, String dataset, int tasks,
                   int vmCount, List<String> algorithms, int totalRuns, double estimateSeconds, double jobBound,
                   List<Map<String, Object>> vms, List<String> warnings) implements LiveEvent {
    }

    /** {@code totalIterations} = 0 untuk heuristik (tidak beriterasi). */
    record RunStart(int index, int total, String algorithm, int seed, boolean stochastic, int totalIterations)
            implements LiveEvent {
    }

    /**
     * Titik-titik iterasi sejak kiriman sebelumnya (paling sering 10 kali per detik), plus waktu
     * selesai tiap VM untuk P_best pada titik terakhir.
     */
    record Iteration(int index, String algorithm, int seed, int[] iteration, double[] evaluations, double[] best,
                     double[] worst, double[] vmFinish) implements LiveEvent {
    }

    /** Jam simulasi CloudSim saat memvalidasi pemetaan, dibanding makespan dari evaluator. */
    record Validation(int index, double simTime, double expectedMakespan) implements LiveEvent {
    }

    record RunEnd(int index, int total, RunRecord record, double[] vmFinish, double elapsedSeconds,
                  double remainingSeconds) implements LiveEvent {
    }

    /** Event terakhir. {@code status}: selesai atau dibatalkan; {@code savedTo} null bila tidak disimpan. */
    record Done(String status, double seconds, String savedTo, List<Summary.ScenarioSummary> summary)
            implements LiveEvent {
    }

    /** Kesalahan tak terduga; juga event terakhir. */
    record Failed(String message) implements LiveEvent {
    }
}

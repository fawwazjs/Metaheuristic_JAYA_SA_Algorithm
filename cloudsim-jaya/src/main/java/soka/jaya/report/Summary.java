package soka.jaya.report;

import soka.jaya.Scenario;
import soka.jaya.Scenarios;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.ToDoubleFunction;

/** Ringkasan per skenario × algoritma dari semua run; dipakai CSV, JSON, dan tabel terminal. */
public final class Summary {
    /** Urutan tampilan algoritma. */
    public static final List<String> ALGORITHM_ORDER = List.of("JAYA", "JAYA (VM id asli)", "SA", "Sufferage", "Round Robin");
    private static final Map<String, Integer> SCENARIO_ORDER = new HashMap<>();

    static {
        List<Scenario> all = Scenarios.select("all");
        for (int i = 0; i < all.size(); i++) {
            SCENARIO_ORDER.put(all.get(i).id(), i);
        }
    }

    private Summary() {
    }

    public record AlgorithmSummary(String algorithm, int runs, Stats makespan, Stats makespanCloudSim,
                                   double gapPercentMax, Stats aru, Stats throughput, Stats doi, Stats avgResponse,
                                   Stats avgWaiting, Stats energy, Stats runtimeMs, Stats lastImprovement,
                                   int finishedMin) {
    }

    public record ScenarioSummary(String id, String group, String dataset, int tasks, int vms, double jobBound,
                                  List<AlgorithmSummary> results) {
    }

    public static List<ScenarioSummary> of(List<RunRecord> records) {
        Map<String, Map<String, List<RunRecord>>> grouped = new LinkedHashMap<>();
        for (RunRecord record : records) {
            grouped.computeIfAbsent(record.scenario(), id -> new LinkedHashMap<>())
                    .computeIfAbsent(record.algorithm(), name -> new ArrayList<>())
                    .add(record);
        }

        List<ScenarioSummary> summaries = new ArrayList<>();
        for (Map.Entry<String, Map<String, List<RunRecord>>> scenario : grouped.entrySet()) {
            RunRecord sample = scenario.getValue().values().iterator().next().get(0);
            List<AlgorithmSummary> results = new ArrayList<>();
            for (Map.Entry<String, List<RunRecord>> algorithm : scenario.getValue().entrySet()) {
                results.add(summarize(algorithm.getKey(), algorithm.getValue()));
            }
            results.sort(Comparator.comparingInt(result -> algorithmRank(result.algorithm())));
            summaries.add(new ScenarioSummary(scenario.getKey(), sample.group(), sample.dataset(), sample.tasks(),
                    sample.vms(), sample.jobBound(), results));
        }
        summaries.sort(Comparator.comparingInt(summary -> scenarioRank(summary.id())));
        return summaries;
    }

    public static void writeCsv(Path file, List<ScenarioSummary> summaries) {
        List<String> lines = new ArrayList<>();
        lines.add("scenario,group,dataset,tasks,vms,job_bound,algorithm,runs,makespan_mean,makespan_std,makespan_min,makespan_max,"
                + "makespan_cloudsim_mean,gap_percent_max,aru_mean,throughput_mean,doi_mean,avg_response_mean,"
                + "avg_waiting_mean,energy_mean,runtime_ms_mean,last_improvement_mean,finished_min");
        for (ScenarioSummary s : summaries) {
            for (AlgorithmSummary a : s.results()) {
                lines.add(String.join(",", s.id(), s.group(), s.dataset(), String.valueOf(s.tasks()),
                        String.valueOf(s.vms()), String.valueOf(s.jobBound()), a.algorithm(), String.valueOf(a.runs()),
                        String.valueOf(a.makespan().mean()), String.valueOf(a.makespan().std()),
                        String.valueOf(a.makespan().min()), String.valueOf(a.makespan().max()),
                        String.valueOf(a.makespanCloudSim().mean()), String.valueOf(a.gapPercentMax()),
                        String.valueOf(a.aru().mean()), String.valueOf(a.throughput().mean()),
                        String.valueOf(a.doi().mean()), String.valueOf(a.avgResponse().mean()),
                        String.valueOf(a.avgWaiting().mean()), String.valueOf(a.energy().mean()),
                        String.valueOf(a.runtimeMs().mean()), String.valueOf(a.lastImprovement().mean()),
                        String.valueOf(a.finishedMin())));
            }
        }
        Output.writeLines(file, lines);
    }

    private static AlgorithmSummary summarize(String algorithm, List<RunRecord> runs) {
        return new AlgorithmSummary(algorithm, runs.size(),
                stats(runs, RunRecord::makespanEval), stats(runs, RunRecord::makespanCloudSim),
                runs.stream().mapToDouble(RunRecord::gapPercent).max().orElse(0),
                stats(runs, RunRecord::aru), stats(runs, RunRecord::throughput), stats(runs, RunRecord::doi),
                stats(runs, RunRecord::avgResponse), stats(runs, RunRecord::avgWaiting), stats(runs, RunRecord::energy),
                stats(runs, RunRecord::runtimeMs), stats(runs, RunRecord::lastImprovement),
                runs.stream().mapToInt(RunRecord::finished).min().orElse(0));
    }

    private static Stats stats(List<RunRecord> runs, ToDoubleFunction<RunRecord> field) {
        return Stats.of(runs.stream().map(run -> field.applyAsDouble(run)).toList());
    }

    private static int algorithmRank(String algorithm) {
        int index = ALGORITHM_ORDER.indexOf(algorithm);
        return index < 0 ? ALGORITHM_ORDER.size() : index;
    }

    private static int scenarioRank(String id) {
        return SCENARIO_ORDER.getOrDefault(id, SCENARIO_ORDER.size());
    }
}

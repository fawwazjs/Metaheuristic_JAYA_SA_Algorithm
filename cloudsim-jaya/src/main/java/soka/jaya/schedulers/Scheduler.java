package soka.jaya.schedulers;

import soka.jaya.Problem;

import java.util.List;

/** Algoritma penjadwalan: menentukan VM untuk setiap cloudlet. */
public interface Scheduler {

    String name();

    Result schedule(Problem problem, long seed);

    /**
     * Seperti {@link #schedule(Problem, long)}, sambil melaporkan setiap iterasi ke
     * {@code listener}. Heuristik tidak beriterasi, jadi bawaannya mengabaikan listener.
     */
    default Result schedule(Problem problem, long seed, SearchListener listener) {
        return schedule(problem, seed);
    }

    /** {@code mapping[i]} = indeks VM untuk cloudlet ke-i; {@code trace} kosong untuk heuristik. */
    record Result(int[] mapping, List<TracePoint> trace) {
    }
}

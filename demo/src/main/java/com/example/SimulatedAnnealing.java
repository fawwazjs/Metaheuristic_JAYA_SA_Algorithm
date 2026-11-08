package com.example;

import java.util.Random;

public class SimulatedAnnealing {

    private final double[] cloudletLength; // panjang tiap cloudlet (MI)
    private final double[] vmMips;         // MIPS per core untuk tiap VM
    private final int vmPes;               // jumlah core per VM
    private final double initialTemp;
    private final double minTemp;
    private final double coolingRate;
    private final int iterPerTemp;
    private final Random random = new Random(42);

    public SimulatedAnnealing(double[] cloudletLength, double[] vmMips, int vmPes,
                              double initialTemp, double minTemp,
                              double coolingRate, int iterPerTemp) {
        this.cloudletLength = cloudletLength;
        this.vmMips = vmMips;
        this.vmPes = vmPes;
        this.initialTemp = initialTemp;
        this.minTemp = minTemp;
        this.coolingRate = coolingRate;
        this.iterPerTemp = iterPerTemp;
    }

    public int[] solve() {
        int[] current = randomSolution();
        double currentCost = fitness(current);

        int[] best = current.clone();
        double bestCost = currentCost;

        double temp = initialTemp;
        while (temp > minTemp) {
            for (int i = 0; i < iterPerTemp; i++) {
                int[] candidate = neighbor(current);
                double candidateCost = fitness(candidate);
                double delta = candidateCost - currentCost;

                // Terima jika lebih baik, atau lebih buruk dengan peluang e^(-delta/temp)
                if (delta < 0 || Math.exp(-delta / temp) > random.nextDouble()) {
                    current = candidate;
                    currentCost = candidateCost;

                    if (currentCost < bestCost) {
                        best = current.clone();
                        bestCost = currentCost;
                    }
                }
            }
            temp *= coolingRate;
        }
        System.out.printf("Makespan estimasi SA: %.2f detik%n", bestCost);
        return best;
    }

    private int[] randomSolution() {
        int[] sol = new int[cloudletLength.length];
        for (int i = 0; i < sol.length; i++) {
            sol[i] = random.nextInt(vmMips.length);
        }
        return sol;
    }

    // Estimasi makespan: dibatasi oleh beban total per VM
    // dan oleh cloudlet terpanjang (yang hanya bisa memakai 1 core)
    public double fitness(int[] sol) {
        double[] load = new double[vmMips.length];
        double[] maxLen = new double[vmMips.length];
        for (int i = 0; i < sol.length; i++) {
            int v = sol[i];
            load[v] += cloudletLength[i];
            maxLen[v] = Math.max(maxLen[v], cloudletLength[i]);
        }
        double makespan = 0;
        for (int v = 0; v < load.length; v++) {
            double byLoad = load[v] / (vmMips[v] * vmPes);
            double byLongest = maxLen[v] / vmMips[v];
            makespan = Math.max(makespan, Math.max(byLoad, byLongest));
        }
        return makespan;
    }

    private int[] neighbor(int[] sol) {
        int[] copy = sol.clone();
        int cloudletIdx = random.nextInt(copy.length);
        copy[cloudletIdx] = random.nextInt(vmMips.length);
        return copy;
    }
}
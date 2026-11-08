package com.example;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.cloudsimplus.brokers.DatacenterBroker;
import org.cloudsimplus.brokers.DatacenterBrokerSimple;
import org.cloudsimplus.builders.tables.CloudletsTableBuilder;
import org.cloudsimplus.cloudlets.Cloudlet;
import org.cloudsimplus.cloudlets.CloudletSimple;
import org.cloudsimplus.core.CloudSimPlus;
import org.cloudsimplus.datacenters.DatacenterSimple;
import org.cloudsimplus.hosts.Host;
import org.cloudsimplus.hosts.HostSimple;
import org.cloudsimplus.resources.Pe;
import org.cloudsimplus.resources.PeSimple;
import org.cloudsimplus.vms.Vm;
import org.cloudsimplus.vms.VmSimple;

public class App {

    // true = pakai hasil SA, false = baseline (round-robin bawaan broker)
    private static final boolean USE_SA = true;

    public static void main(String[] args) {
        CloudSimPlus simulation = new CloudSimPlus();

        // 1 host besar: 16 core @ 2000 MIPS
        List<Pe> peList = new ArrayList<>();
        for (int i = 0; i < 16; i++) peList.add(new PeSimple(2000));
        Host host = new HostSimple(32_768, 100_000, 1_000_000, peList);
        new DatacenterSimple(simulation, List.of(host));

        DatacenterBroker broker = new DatacenterBrokerSimple(simulation);

        // 4 VM dengan kecepatan berbeda, masing-masing 2 core
        double[] mips = {500, 1000, 1500, 2000};
        int vmPes = 2;
        List<Vm> vmList = new ArrayList<>();
        for (double m : mips) {
            vmList.add(new VmSimple(m, vmPes).setRam(512).setBw(1000).setSize(10_000));
        }

        // 20 cloudlet (1 core) dengan panjang acak 5.000 - 20.000 MI
        Random rnd = new Random(1);
        List<Cloudlet> cloudletList = new ArrayList<>();
        double[] lengths = new double[20];
        for (int i = 0; i < lengths.length; i++) {
            long len = 5_000 + rnd.nextInt(15_000);
            lengths[i] = len;
            cloudletList.add(new CloudletSimple(len, 1));
        }

        if (USE_SA) {
            SimulatedAnnealing sa = new SimulatedAnnealing(lengths, mips, vmPes, 100, 0.001, 0.95, 100);
            int[] mapping = sa.solve();
            for (int i = 0; i < cloudletList.size(); i++) {
                cloudletList.get(i).setVm(vmList.get(mapping[i]));
            }
        }

        broker.submitVmList(vmList);
        broker.submitCloudletList(cloudletList);

        simulation.start();
        new CloudletsTableBuilder(broker.getCloudletFinishedList()).build();

        double makespan = broker.getCloudletFinishedList().stream()
                .mapToDouble(Cloudlet::getFinishTime)
                .max().orElse(0);
        System.out.printf("%n=== Mode: %s | Makespan simulasi: %.2f detik ===%n",
                USE_SA ? "SIMULATED ANNEALING" : "BASELINE", makespan);
    }
}
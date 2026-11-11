package soka.jaya;

import ch.qos.logback.classic.Level;
import org.cloudsimplus.allocationpolicies.VmAllocationPolicySimple;
import org.cloudsimplus.brokers.DatacenterBrokerSimple;
import org.cloudsimplus.cloudlets.Cloudlet;
import org.cloudsimplus.cloudlets.CloudletSimple;
import org.cloudsimplus.core.CloudSimPlus;
import org.cloudsimplus.datacenters.Datacenter;
import org.cloudsimplus.datacenters.DatacenterSimple;
import org.cloudsimplus.hosts.Host;
import org.cloudsimplus.hosts.HostSimple;
import org.cloudsimplus.resources.Pe;
import org.cloudsimplus.resources.PeSimple;
import org.cloudsimplus.schedulers.cloudlet.CloudletSchedulerSpaceShared;
import org.cloudsimplus.schedulers.vm.VmSchedulerSpaceShared;
import org.cloudsimplus.util.Log;
import org.cloudsimplus.vms.Vm;
import org.cloudsimplus.vms.VmSimple;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Menjalankan satu pemetaan cloudlet → VM di CloudSim Plus 8.0.0. */
public final class CloudSimRunner {
    private CloudSimRunner() {
    }

    /** @param vmOfCloudlet VM tempat setiap cloudlet benar-benar dijalankan */
    public record Result(double makespan, int finishedCloudlets, Map<String, Integer> vmsPerDatacenter,
                         int[] vmOfCloudlet) {
    }

    /** Dipanggil setiap jam simulasi maju; mengembalikan false untuk menghentikan simulasi (pembatalan). */
    @FunctionalInterface
    public interface ClockWatcher {
        ClockWatcher NONE = time -> true;

        boolean onClock(double time);
    }

    public static Result run(long[] lengths, List<Infrastructure.VmSpec> vmSpecs, int[] mapping) {
        return run(lengths, vmSpecs, mapping, ClockWatcher.NONE);
    }

    public static Result run(long[] lengths, List<Infrastructure.VmSpec> vmSpecs, int[] mapping, ClockWatcher watcher) {
        Log.setLevel(Level.OFF);
        CloudSimPlus simulation = new CloudSimPlus();

        List<Datacenter> datacenters = new ArrayList<>();
        for (int dc = 0; dc < Infrastructure.DATACENTERS.size(); dc++) {
            DatacenterSimple datacenter = new DatacenterSimple(simulation, hosts(Infrastructure.HOST_PE_MIPS.get(dc)),
                    new VmAllocationPolicySimple());
            datacenter.setName(Infrastructure.DATACENTERS.get(dc));
            datacenter.setSchedulingInterval(Infrastructure.SCHEDULING_INTERVAL);
            datacenters.add(datacenter);
        }

        DatacenterBrokerSimple broker = new DatacenterBrokerSimple(simulation);
        // Setiap VM diarahkan ke datacenter yang ditentukan desain, bukan dipilih broker.
        broker.setDatacenterMapper((lastDatacenter, vm) -> datacenters.get(vmSpecs.get((int) vm.getId()).datacenter()));

        List<Vm> vms = new ArrayList<>(vmSpecs.size());
        for (Infrastructure.VmSpec spec : vmSpecs) {
            Vm vm = new VmSimple(spec.index(), spec.type().mips(), spec.type().pes())
                    .setRam(Infrastructure.VM_RAM_MB)
                    .setBw(Infrastructure.VM_BW)
                    .setSize(Infrastructure.VM_STORAGE_MB)
                    .setCloudletScheduler(new CloudletSchedulerSpaceShared());
            vms.add(vm);
        }

        Map<String, Integer> vmsPerDatacenter = new TreeMap<>();
        broker.addOnVmsCreatedListener(info -> {
            vmsPerDatacenter.clear();
            for (Vm vm : info.getDatacenterBroker().getVmCreatedList()) {
                vmsPerDatacenter.merge(vm.getHost().getDatacenter().getName(), 1, Integer::sum);
            }
        });

        List<Cloudlet> cloudlets = new ArrayList<>(lengths.length);
        for (int i = 0; i < lengths.length; i++) {
            Cloudlet cloudlet = new CloudletSimple(i, lengths[i], 1);
            cloudlet.setVm(vms.get(mapping[i]));
            cloudlets.add(cloudlet);
        }

        broker.submitVmList(vms);
        broker.submitCloudletList(cloudlets);
        if (watcher != ClockWatcher.NONE) {
            simulation.addOnClockTickListener(info -> {
                if (!watcher.onClock(info.getTime())) {
                    simulation.terminate();
                }
            });
        }
        simulation.start();

        int[] vmOfCloudlet = new int[lengths.length];
        int finished = 0;
        double makespan = 0;
        for (Cloudlet cloudlet : broker.getCloudletFinishedList()) {
            int i = (int) cloudlet.getId();
            vmOfCloudlet[i] = (int) cloudlet.getVm().getId();
            if (cloudlet.getStatus() == Cloudlet.Status.SUCCESS) {
                finished++;
            }
            makespan = Math.max(makespan, cloudlet.getFinishTime());
        }
        return new Result(makespan, finished, vmsPerDatacenter, vmOfCloudlet);
    }

    private static List<Host> hosts(double peMips) {
        List<Host> hosts = new ArrayList<>(Infrastructure.HOSTS_PER_DATACENTER);
        for (int h = 0; h < Infrastructure.HOSTS_PER_DATACENTER; h++) {
            List<Pe> pes = new ArrayList<>(Infrastructure.HOST_PES);
            for (int p = 0; p < Infrastructure.HOST_PES; p++) {
                pes.add(new PeSimple(peMips));
            }
            Host host = new HostSimple(Infrastructure.HOST_RAM_MB, Infrastructure.HOST_BW,
                    Infrastructure.HOST_STORAGE_MB, pes);
            host.setVmScheduler(new VmSchedulerSpaceShared());
            hosts.add(host);
        }
        return hosts;
    }
}

package soka.jaya;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class InfrastructureTest {

    @Test
    void fiftyVmsAreSplitEvenlyAcrossDatacentersAndTypes() {
        List<Infrastructure.VmSpec> vms = Infrastructure.vms(50);

        Map<Integer, Long> perDatacenter = vms.stream()
                .collect(Collectors.groupingBy(Infrastructure.VmSpec::datacenter, Collectors.counting()));
        Map<String, Long> perType = vms.stream()
                .collect(Collectors.groupingBy(vm -> vm.type().name(), Collectors.counting()));

        assertEquals(Map.of(0, 25L, 1, 25L), perDatacenter);
        perType.values().forEach(count -> assertEquals(10L, count));
    }

    @Test
    void everyTenVmsContainTwoOfEachType() {
        Map<String, Long> perType = Infrastructure.vms(10).stream()
                .collect(Collectors.groupingBy(vm -> vm.type().name(), Collectors.counting()));

        assertEquals(5, perType.size());
        perType.values().forEach(count -> assertEquals(2L, count));
    }

    @Test
    void vmCountMustBeAMultipleOfTen() {
        assertThrows(IllegalArgumentException.class, () -> Infrastructure.vms(25));
    }

    @Test
    void problemCarriesVmSpeedAndCores() {
        Problem problem = Infrastructure.problem(new long[]{1000, 2000}, Infrastructure.vms(10));

        assertEquals(10, problem.vmCount());
        assertEquals(500, problem.vmMips()[0]);
        assertEquals(1, problem.vmPes()[0]);
        assertEquals(1600, problem.vmMips()[4]);
        assertEquals(3, problem.vmPes()[4]);
    }
}

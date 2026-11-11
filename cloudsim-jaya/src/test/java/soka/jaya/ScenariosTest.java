package soka.jaya;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScenariosTest {

    @Test
    void allScenariosCoverSixteenPoints() {
        List<Scenario> all = Scenarios.select("all");

        assertEquals(16, all.size());
        assertEquals(16, all.stream().map(Scenario::id).collect(Collectors.toSet()).size());
    }

    @Test
    void testCaseOneVariesTasksOnFiftyVms() {
        List<Scenario> tc1 = Scenarios.select("tc1");

        assertEquals(10, tc1.size());
        assertEquals(Set.of(50), tc1.stream().map(Scenario::vms).collect(Collectors.toSet()));
        assertEquals(100, tc1.get(0).tasks());
        assertEquals(1000, tc1.get(9).tasks());
    }

    @Test
    void testCaseTwoVariesVmsOnSevenHundredFiftyTasks() {
        List<Scenario> tc2 = Scenarios.select("tc2");

        assertEquals(List.of(10, 20, 30, 40, 50), tc2.stream().map(Scenario::vms).toList());
        assertTrue(tc2.stream().allMatch(s -> s.tasks() == 750 && s.dataset().equals("gocj")));
    }

    @Test
    void nasaScenarioUsesTheFirst750Jobs() {
        Scenario nasa = Scenarios.select("nasa").get(0);

        assertEquals(750, nasa.lengths(Path.of("data")).length);
        assertEquals("nasa", nasa.dataset());
    }

    @Test
    void unknownGroupIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> Scenarios.select("tc9"));
    }
}

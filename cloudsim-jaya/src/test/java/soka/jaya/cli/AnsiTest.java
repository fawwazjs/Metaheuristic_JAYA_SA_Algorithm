package soka.jaya.cli;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnsiTest {

    @Test
    void sparklineFallsWithTheMakespanAndFitsItsWidth() {
        double[] falling = {9000, 7000, 5000, 4000, 3500, 3200, 3000, 2900, 2850, 2800};

        String line = Ansi.sparkline(falling, 5);

        assertEquals(5, line.length());
        assertEquals('█', line.charAt(0));
        assertEquals('▁', line.charAt(line.length() - 1));
    }

    @Test
    void sparklineOfAFlatCurveIsFlat() {
        assertEquals("▄▄▄", Ansi.sparkline(new double[]{562, 562, 562}, 10));
        assertEquals("", Ansi.sparkline(new double[0], 10));
    }

    @Test
    void barFillsInProportion() {
        assertEquals("█████░░░░░", Ansi.bar(0.5, 10));
        assertEquals("░░░░", Ansi.bar(-1, 4));
        assertEquals("████", Ansi.bar(2, 4));
    }

    @Test
    void columnsShowEachVmRelativeToTheSlowest() {
        assertEquals("·▄█", Ansi.columns(new double[]{0, 500, 1000}, 1000));
    }

    @Test
    void fitCountsOnlyVisibleCharacters() {
        String colored = Ansi.color("JAYA", Ansi.GREEN, true) + " seed 1 makespan 2.204,1 s";

        assertEquals(colored, Ansi.fit(colored, 80));
        String cut = Ansi.fit(colored, 12);
        assertEquals(11, Ansi.visibleLength(cut));
        assertTrue(cut.endsWith("…" + Ansi.RESET), cut);
    }
}

package soka.jaya.schedulers;

/** Pendengar progres pencarian, dipanggil di thread yang sama dengan algoritmanya. */
@FunctionalInterface
public interface SearchListener {
    SearchListener NONE = step -> {
    };

    void onStep(SearchStep step);
}

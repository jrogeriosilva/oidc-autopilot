import { useRef, useCallback } from "react";

interface DragHandlers {
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export function useDragReorder(
  onReorder: (fromIndex: number, toIndex: number) => void,
): DragHandlers {
  const dragIdx = useRef(-1);

  const clearIndicators = useCallback((container: HTMLElement | null) => {
    if (!container) return;
    container
      .querySelectorAll(".drag-over-above,.drag-over-below")
      .forEach((el) =>
        el.classList.remove("drag-over-above", "drag-over-below"),
      );
  }, []);

  const onDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIdx.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    const el = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => el.classList.add("drag-opacity-reduced"));
  }, []);

  const onDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("drag-opacity-reduced");
    dragIdx.current = -1;
    clearIndicators((e.currentTarget as HTMLElement).parentElement);
  }, [clearIndicators]);

  const onDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const el = e.currentTarget as HTMLElement;
      clearIndicators(el.parentElement);
      if (dragIdx.current === -1 || dragIdx.current === index) return;
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        el.classList.add("drag-over-above");
      } else {
        el.classList.add("drag-over-below");
      }
    },
    [clearIndicators],
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.classList.remove("drag-over-above", "drag-over-below");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      clearIndicators(el.parentElement);
      const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(fromIdx) || fromIdx === index) return;
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      let toIdx = e.clientY < midY ? index : index + 1;
      if (fromIdx < toIdx) toIdx--;
      if (fromIdx === toIdx) return;
      onReorder(fromIdx, toIdx);
    },
    [onReorder, clearIndicators],
  );

  return { onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop };
}

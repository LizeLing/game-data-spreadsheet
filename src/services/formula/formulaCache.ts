/**
 * Formula Cache
 * 수식 계산 결과 캐싱 및 무효화
 */

import type { CellValue } from '@types';

export interface CacheEntry {
  value: CellValue;
  timestamp: number;
  dependencies: Set<string>;
}

export class FormulaCache {
  private cache: Map<string, CacheEntry>;
  private dependencyGraph: Map<string, Set<string>>; // cellId -> cells that depend on it

  constructor() {
    this.cache = new Map();
    this.dependencyGraph = new Map();
  }

  /**
   * Get cached value
   */
  get(cellId: string): CellValue | undefined {
    const entry = this.cache.get(cellId);
    return entry?.value;
  }

  /**
   * Set cached value
   */
  set(cellId: string, value: CellValue, dependencies: string[] = []): void {
    this.cache.set(cellId, {
      value,
      timestamp: Date.now(),
      dependencies: new Set(dependencies),
    });

    // Update dependency graph
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(cellId);
    }
  }

  /**
   * Check if value is cached
   */
  has(cellId: string): boolean {
    return this.cache.has(cellId);
  }

  /**
   * Invalidate cache for a cell
   */
  invalidate(cellId: string): void {
    this.cache.delete(cellId);
  }

  /**
   * Invalidate cache for a cell and all dependent cells
   */
  invalidateCascade(cellId: string): void {
    const toInvalidate = this.getCascadeDependents(cellId);
    toInvalidate.forEach((id) => this.cache.delete(id));
  }

  /**
   * Get all cells that directly or indirectly depend on a given cell
   */
  private getCascadeDependents(cellId: string): Set<string> {
    const visited = new Set<string>();
    const queue: string[] = [cellId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);

      const dependents = this.dependencyGraph.get(current);
      if (dependents) {
        dependents.forEach((dep) => {
          if (!visited.has(dep)) {
            queue.push(dep);
          }
        });
      }
    }

    return visited;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.dependencyGraph.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    dependencies: number;
    oldestEntry: number | null;
  } {
    let oldestTimestamp: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      dependencies: this.dependencyGraph.size,
      oldestEntry: oldestTimestamp,
    };
  }

  /**
   * Remove old entries (cache eviction)
   */
  evictOldEntries(maxAge: number = 5 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [cellId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        toDelete.push(cellId);
      }
    }

    toDelete.forEach((cellId) => {
      this.cache.delete(cellId);
      // Also remove from dependency graph
      this.dependencyGraph.delete(cellId);
      this.dependencyGraph.forEach((deps) => deps.delete(cellId));
    });
  }

  /**
   * Batch recalculate cells
   */
  batchRecalculate(
    cellIds: string[],
    calculator: (cellId: string) => CellValue
  ): void {
    // Topological sort to calculate in dependency order
    const sorted = this.topologicalSort(cellIds);

    for (const cellId of sorted) {
      const value = calculator(cellId);
      const entry = this.cache.get(cellId);
      const dependencies = entry ? Array.from(entry.dependencies) : [];
      this.set(cellId, value, dependencies);
    }
  }

  /**
   * Topological sort for dependency-ordered calculation
   */
  private topologicalSort(cellIds: string[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (cellId: string) => {
      if (visited.has(cellId)) return;
      visited.add(cellId);

      // Visit dependencies first
      const entry = this.cache.get(cellId);
      if (entry) {
        entry.dependencies.forEach(visit);
      }

      result.push(cellId);
    };

    cellIds.forEach(visit);
    return result;
  }
}

/**
 * Singleton instance
 */
export const formulaCache = new FormulaCache();

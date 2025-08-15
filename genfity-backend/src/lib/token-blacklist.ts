// Token blacklist management
// In production, this should be implemented using Redis or a database
// for persistence across server restarts and multiple instances

class TokenBlacklist {
  private blacklist = new Set<string>();

  add(token: string): void {
    this.blacklist.add(token);
  }

  has(token: string): boolean {
    return this.blacklist.has(token);
  }

  remove(token: string): boolean {
    return this.blacklist.delete(token);
  }

  clear(): void {
    this.blacklist.clear();
  }

  size(): number {
    return this.blacklist.size;
  }
}

// Export singleton instance
export const tokenBlacklist = new TokenBlacklist();

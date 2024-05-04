export class ObjectUtil {
  /**
   * 将List转换为Map
   */
  static listToMap<T extends Object>(list: T[], key: keyof T): Map<string, T> {
    if (!list || list.length === 0) {
      return new Map<string, T>();
    }

    if (!Object.hasOwn(list[0], key)) {
      return new Map<string, T>();
    }

    const map = new Map<string, T>();
    list.forEach((item) => {
      map.set(item[key] as any, item);
    });
    return map;
  }
}

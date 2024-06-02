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

  /**
   * 检查是否含有无效属性
   * @param obj
   */
  static checkHasInvalidProperties(obj: any): boolean {
    if (obj === null || obj === undefined) {
      return false;
    }

    if (Array.isArray(obj)) {
      const results: boolean[] = obj.map((item) =>
        ObjectUtil.checkHasInvalidProperties(item),
      );

      return (
        results.filter((v: boolean): boolean => {
          return v === false;
        }).length === 0
      );
    }

    for (const key in obj) {
      if (/\d/.test(key)) {
        return false;
      }

      if (Object.hasOwn(obj, key)) {
        const value = obj[key];
        if (ObjectUtil.isNotValidData(value)) {
          return false;
        }

        const cleanedValue: boolean =
          ObjectUtil.checkHasInvalidProperties(value);
        if (ObjectUtil.isNotValidData(cleanedValue)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 检验是否为无效数据
   */
  static isNotValidData(data: any): boolean {
    return (
      data === null ||
      data === undefined ||
      (typeof data === 'string' && data.trim() === '') ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === 'object' && Object.keys(data).length === 0)
    );
  }
}

import { ValidationError } from '../errors/ValidationError';
import { ProductVariant } from '../types/Product';

type LegacyStockItem = {
  size?: unknown;
  color?: unknown;
  quantity?: unknown;
};

const asObject = (value: unknown, message: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(message, ['variants']);
  }
  return value as Record<string, unknown>;
};

const normalizeColor = (value: string): string => value.trim().toUpperCase();
const normalizeSize = (value: string): string => value.trim().toUpperCase();

const parseQuantity = (value: unknown, message: string): number => {
  const quantity = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ValidationError(message, ['variants']);
  }
  return quantity;
};

const parseColorList = (colors: unknown): string[] => {
  if (!Array.isArray(colors)) {
    return [];
  }

  const normalized = colors
    .filter((color): color is string => typeof color === 'string')
    .map((color) => normalizeColor(color))
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

export const normalizeAndValidateVariants = (
  variants: unknown,
  options?: { allowEmpty?: boolean }
): ProductVariant[] => {
  if (!Array.isArray(variants)) {
    throw new ValidationError('Variants must be an array', ['variants']);
  }

  if (variants.length === 0) {
    if (options?.allowEmpty) {
      return [];
    }
    throw new ValidationError('Variants must be a non-empty array', ['variants']);
  }

  const seenColors = new Set<string>();

  return variants.map((variantRaw, variantIndex) => {
    const variant = asObject(
      variantRaw,
      `Variant at index ${variantIndex} must be an object`
    );

    if (typeof variant.color !== 'string' || variant.color.trim() === '') {
      throw new ValidationError(
        `Variant at index ${variantIndex} must include a valid color`,
        ['variants']
      );
    }

    const color = normalizeColor(variant.color);
    if (seenColors.has(color)) {
      throw new ValidationError(
        `Duplicate color "${color}" found in variants`,
        ['variants']
      );
    }
    seenColors.add(color);

    if (!Array.isArray(variant.sizes) || variant.sizes.length === 0) {
      throw new ValidationError(
        `Variant "${color}" must include a non-empty sizes array`,
        ['variants']
      );
    }

    const seenSizes = new Set<string>();
    const sizes = variant.sizes.map((sizeRaw, sizeIndex) => {
      const sizeEntry = asObject(
        sizeRaw,
        `Size at index ${sizeIndex} for color "${color}" must be an object`
      );

      if (typeof sizeEntry.size !== 'string' || sizeEntry.size.trim() === '') {
        throw new ValidationError(
          `Size at index ${sizeIndex} for color "${color}" is invalid`,
          ['variants']
        );
      }

      const size = normalizeSize(sizeEntry.size);
      if (seenSizes.has(size)) {
        throw new ValidationError(
          `Duplicate size "${size}" found for color "${color}"`,
          ['variants']
        );
      }
      seenSizes.add(size);

      const quantity = parseQuantity(
        sizeEntry.quantity,
        `Quantity for color "${color}" and size "${size}" must be an integer >= 0`
      );

      return { size, quantity };
    });

    return { color, sizes };
  });
};

export const legacyStockToVariants = (params: {
  stock: unknown;
  colors?: unknown;
  baseColor?: string | undefined;
}): ProductVariant[] => {
  const { stock, colors, baseColor } = params;

  if (!Array.isArray(stock) || stock.length === 0) {
    throw new ValidationError('Stock must be a non-empty array', ['stock']);
  }

  const allowedColors = parseColorList(colors);
  const fallbackBaseColor =
    typeof baseColor === 'string' && baseColor.trim() !== ''
      ? normalizeColor(baseColor)
      : '';

  const grouped = new Map<string, Map<string, number>>();

  for (let index = 0; index < stock.length; index += 1) {
    const item = stock[index] as LegacyStockItem;

    if (typeof item.size !== 'string' || item.size.trim() === '') {
      throw new ValidationError(`Stock at index ${index} has an invalid size`, ['stock']);
    }
    const size = normalizeSize(item.size);

    const quantity = parseQuantity(
      item.quantity,
      `Stock at index ${index} has an invalid quantity`
    );

    const rawColor = typeof item.color === 'string' ? item.color.trim() : '';
    let color = rawColor ? normalizeColor(rawColor) : '';

    if (!color) {
      if (allowedColors.length === 1) {
        color = allowedColors[0] ?? '';
      } else if (fallbackBaseColor) {
        color = fallbackBaseColor;
      } else {
        throw new ValidationError(
          `Stock at index ${index} is missing color and no unique fallback is available`,
          ['stock']
        );
      }
    }

    if (allowedColors.length > 0 && !allowedColors.includes(color)) {
      throw new ValidationError(
        `Stock at index ${index} uses color "${color}" not present in colors list`,
        ['stock']
      );
    }

    const sizesByColor = grouped.get(color) ?? new Map<string, number>();
    if (sizesByColor.has(size)) {
      throw new ValidationError(
        `Duplicate stock combination for color "${color}" and size "${size}"`,
        ['stock']
      );
    }

    sizesByColor.set(size, quantity);
    grouped.set(color, sizesByColor);
  }

  const variants: ProductVariant[] = Array.from(grouped.entries()).map(
    ([color, sizesMap]) => ({
      color,
      sizes: Array.from(sizesMap.entries()).map(([size, quantity]) => ({
        size,
        quantity,
      })),
    })
  );

  return normalizeAndValidateVariants(variants);
};

export const resolveVariantsFromPayload = (payload: {
  variants?: unknown;
  stock?: unknown;
  colors?: unknown;
  baseColor?: string | undefined;
}): ProductVariant[] => {
  if (payload.variants !== undefined) {
    return normalizeAndValidateVariants(payload.variants);
  }

  if (payload.stock !== undefined) {
    return legacyStockToVariants({
      stock: payload.stock,
      colors: payload.colors,
      baseColor: payload.baseColor,
    });
  }

  throw new ValidationError('Variants are required', ['variants']);
};

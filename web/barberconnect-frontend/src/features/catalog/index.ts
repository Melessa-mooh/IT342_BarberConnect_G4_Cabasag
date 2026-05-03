/**
 * Vertical Slice Architecture — Catalog Feature
 *
 * Barrel module grouping all haircut catalog services and components.
 */
export { haircutStyleService, type HaircutStyle } from '../../services/haircutStyleService';
export { default as CatalogPanel } from '../../pages/barber/components/CatalogPanel';

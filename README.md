# Tienda web multi-tenant

Tienda pública React/Vite. Resuelve restaurantes por `/:username`, compra delivery/takeaway, salas grupales y links de growth. Las rutas parten de `src/main.tsx`; el menú/checkout principal está en `src/pages/MenuDelivery.tsx`.

Ver [`../AGENTS.md`](../AGENTS.md), [`../docs/ORDERS.md`](../docs/ORDERS.md) y [`../docs/CUSTOMERS_AND_GROWTH.md`](../docs/CUSTOMERS_AND_GROWTH.md).

```bash
bun install
bun run dev
bun run build
bun run lint
```

Los clones single-tenant son forks separados: un cambio aquí no los actualiza automáticamente.

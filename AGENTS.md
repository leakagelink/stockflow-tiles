<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Stock, orders, stores and categories live in Lovable Cloud tables (public.products/stores/orders/categories); the 25-peti-sets-75-stock rule is enforced by the SQL function `place_order` (transactional stock deduction), not in app code. Admin writes go through `adminAction` server function that verifies the admin PIN server-side against `app_settings`; the store PIN is never exposed through the public API (login/order verify it via `store_login`/`place_order` SQL functions). Client state syncs via realtime on products/orders.

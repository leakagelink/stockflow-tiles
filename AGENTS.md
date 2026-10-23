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
- Stock, orders, stores and categories live in Lovable Cloud tables (public.products/stores/orders/categories); the stock-deduction rule is enforced by the SQL function `place_order_auth` (transactional, resolves the caller's store from `store_members` via `auth.uid()`), not in app code. Store staff sign in with email/password accounts (Lovable Cloud Auth); `store_members` maps user → store and admin assigns it from the Admin Panel. The old PIN functions `store_login`/`place_order` and `stores.pin` are DEPRECATED (kept, unused). Admin writes go through `adminAction` server function that verifies the admin PIN server-side against `app_settings`. Client state syncs via realtime on products/orders.

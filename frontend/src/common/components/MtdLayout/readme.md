# Bottom Bar layout

If you want split pane layout (horizontal) with some default beahvior out of the box.

### Deals with problems

---

- Scroll in top element/panel is handled
- callback to update/open panel from the body component is available
- State is retained for the bottom tabs (rerendering is not done for each tab shift/ close-open)

### How to use?

---

1. Wrap your element using `withBottomBarLayout(component: React.FC<IBottomBarLayoutBody>)`
   ```js
   export default withBottomBarLayout(EditorBody);
   ```
2. In editor body component you will get following elements by props

   - `openBottomBarTab` callback
   - `setBottomBarItems` callback

3. Use `setBottomBarItems` to set bottom bar tab item and panel bodies to render.

4. use `openBottomBarTab` callback to open or modify state of any tab.

5. Bottom bar tab body can be without props also which handles all its state inside its component. (you are not forced to use props)

### Rules

---

1. IBottomBarLayoutBody: body layout any element using bottom bar layout should use.
2. Don't try to dynamically add tabs, use setBottomBarItems for only initial load.

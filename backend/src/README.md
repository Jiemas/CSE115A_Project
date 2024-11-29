
#### 11/28/24

Test set: **20ac9f15-c2fd-4c44-ae2d-33273841ebc0**

- Updated version of card order update:
    - Updated the implementation. Instead of swapping two adjacent cards based on direction, just change the order to the updated order. Let frontend handle shifting the cards if there are multiple cards ibetweent the current and new order. 
    - Two cards with the same order doesn't make the backend crash, so it still "sorts" them. Let the frontend handle how to sort and fix their orders with shifting indices in the array etc.
    - Create new db helper function to only update the card order, leave the current db update function to update the card body only, not order property as well.
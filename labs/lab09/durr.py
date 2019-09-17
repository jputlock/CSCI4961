def bin_search(x, L):
    low = 0
    high = len(L)
    while low != high:
        mid = (low+high)//2
        if x > L[mid]:
            low = mid + 1
        else:
            high = mid
    return low

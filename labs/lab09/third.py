
from PIL import Image
import numpy

im = Image.open("images/bag.png")
np_im = numpy.array(im)
print (np_im.shape)

np_im = np_im - 18
new_im = Image.fromarray(np_im)
img = (np.expand_dims(img,0))

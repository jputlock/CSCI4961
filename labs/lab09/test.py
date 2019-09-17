import tensorflow as tf
import numpy as np
num_examples = 50
X = np.array([np.linspace(-2, 4, num_examples), np.linspace(6,-18, num_examples)])
x, y = X
y += np.random.randn(num_examples)
bias_with_x = np.array([(1.0,a) for a in x]).astype(np.float32)
training_steps = 50
learning_rate = 0.002
# with tf.Session() as sess:
#     input = tf.constant(bias_with_x)
#     target = tf.constant(np.transpose([y]).astype(np.float32))
#     weights = tf.Variable(tf.random_normal([2,1],0,0.1))
#     tf.global_variables_initializer.run()
#     yhat = tf.matmul(input, weights)
#     yerror = tf.substract(yhat, target)
#     loss = tf.nn.12_loss(yerror)
#     update_weights = tf.train.GradientDescentOptimizer(learning_rate).minimize(loss)
#     for _ in range(training_steps):
#         sess.run(update_weights)
#     betas = weights.eval()

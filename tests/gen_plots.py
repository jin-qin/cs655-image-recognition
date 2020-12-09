import csv
import matplotlib.pyplot as plt
import numpy as np

loss_rates = []
goodputs = []
throughputs = []
accuracies = []
avg_times = []
with open('results.csv', 'r') as csvfile:
    csvreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
    for row in csvreader:
        new_row = [float(item) for item in row]
        loss_rates.append(new_row[0])
        goodputs.append(new_row[1])
        throughputs.append(new_row[2])
        accuracies.append(new_row[3])
        avg_times.append(new_row[4])

fig, ax = plt.subplots(2, 2, figsize=(20,20))
ax[0, 0].plot(loss_rates, goodputs, '.-')
ax[0, 0].set_ylabel('Goodput (requests / sec)')
ax[0, 0].set_xlabel('Loss rate')
ax[0, 0].set_title('Goodput to loss rate')

ax[0, 1].plot(loss_rates, throughputs, '.-')
ax[0, 1].set_ylabel('Throughput （requests / sec)')
ax[0, 1].set_xlabel('Loss rate')
ax[0, 1].set_title('Throughput to loss rate')

ax[1, 0].plot(loss_rates, avg_times, '.-')
ax[1, 0].set_ylabel('Average job execution time (seconds)')
ax[1, 0].set_xlabel('Loss rate')
ax[1, 0].set_title('Average job execution time to loss rate')

ax[1, 1].plot(loss_rates, np.array(accuracies) * 100, '.-')
ax[1, 1].set_ylabel('Accuracy (%)')
ax[1, 1].set_xlabel('Loss rate')
ax[1, 1].set_title('Accuracy to loss rate')

fig.savefig('all_results.jpg')
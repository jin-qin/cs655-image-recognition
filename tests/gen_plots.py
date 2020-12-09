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
ax[0, 0].set_ylabel('requests / sec')
ax[0, 0].set_xlabel('Goodput')

ax[0, 1].plot(loss_rates, throughputs, '.-')
ax[0, 1].set_ylabel('requests / sec')
ax[0, 1].set_xlabel('Throughput')

ax[1, 0].plot(loss_rates, avg_times, '.-')
ax[1, 0].set_ylabel('seconds')
ax[1, 0].set_xlabel('Average job execution time')

ax[1, 1].plot(loss_rates, np.array(accuracies) * 100, '.-')
ax[1, 1].set_ylabel('percent')
ax[1, 1].set_xlabel('Accuracy')

fig.savefig('all_results.jpg')
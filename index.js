const cluster = require('cluster'),
    stopSignals = [
        'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
        'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ],
    production = process.env.NODE_ENV == 'production';

let stopping = false;

cluster.on('disconnect', function (worker) {
    console.log('The worker #%d has disconnected', worker.id);
    if (production) {
        if (!stopping) {
            console.log(`The worker is restarting`);
            cluster.fork();
        }
    } else {
        process.exit(1);
    }
});

cluster.on('exit', function (worker, code, signal) {
    console.log('Worker #%d has exit (%s).', worker.process.pid, signal || code);
    if (!stopping) {
        console.log('Worker restarting...');
        cluster.fork();
    }
});

if (cluster.isMaster) {
    const workerCount = require('os').cpus().length;
    console.log(`Starting ${workerCount} workers...`);

    for (let i = 0; i < workerCount; i++) {
        cluster.fork();
    }

    if (production) {
        stopSignals.forEach(function (signal) {
            process.on(signal, function () {
                console.log(`Got ${signal}, stopping workers...`);
                stopping = true;
                cluster.disconnect(function () {
                    console.log('All workers stopped, exiting.');
                    process.exit(0);
                });
            });
        });
    }
} else {
    require('./app.js');
}

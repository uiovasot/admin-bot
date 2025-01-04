import {exec} from 'child_process';

function runDev() {
    const process = exec('bun --watch index.ts');

    process.stdout?.on('data', (data) => {
        console.log(data);
    });

    process.stderr?.on('data', (data) => {
        console.error(data);
    });

    process.on('exit', (code) => {
        console.log(`프로세스 종료: ${code}`);
        if (code !== 0) {
            console.log('1초 후에 자동 재시작합니다...');
            setTimeout(runDev, 1000);
        }
    });
}

runDev();
